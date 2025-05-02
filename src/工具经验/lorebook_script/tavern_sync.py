#!/usr/bin/env python3
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import List

import send2trash
import yaml


def load_config(config_path: Path) -> dict:
    """Load the JSON configuration file"""
    with config_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def confirm_action(action):
    """Ask the user to confirm the action before proceeding"""
    response = input(f"你确定要{action}? (yes/no): ").strip().lower()
    return response == "yes"


class Entry:
    def __init__(self, title: str, file: Path, content: str, spaces: str, type: str):
        self.title = title
        self.file = file
        self.content = content
        self.spaces = spaces
        self.type = type


def extract_file_content(file_path: Path, user_name: str) -> str:
    """Read the content of a file and return it as a string"""
    content = file_path.read_text(encoding="utf-8")
    if user_name and user_name in content:
        content = content.replace(user_name, "<user>")
        file_path.write_text(content, encoding="utf-8")
        print(f"{file_path}: 已替换 {user_name} 为 <user>")
    return content


def trim_json(text: str) -> str:
    def replace_func(match):
        if match.group(1):
            return match.group(1)
        elif match.group(2):
            return match.group(3)

    return re.sub(r'("[^"]*")|(\s+)(//.*\n)?', replace_func, text)


def codify_json(text: str) -> str:
    return re.sub(r"( *)// :(.*)", r'\2', text)


def to_flow_yaml(path: Path) -> str:
    return subprocess.run(
        ["yq", '.. style="flow"', str(path)],
        check=True, stdout=subprocess.PIPE, text=True, encoding="utf-8").stdout


def codify_yaml(text: str) -> str:
    return re.sub(r"( *)\# :(.*)", r'\2', text)


def split_yaml_entries(path: Path, content: str, should_trim: bool) -> List[Entry]:
    """Split content into entries based on regex matches"""
    if should_trim:
        content = to_flow_yaml(path)

    entries = []
    pattern = re.compile(r"( *)\# \^([^\n]+)\n([\s\S]*?)((?= *\# \^[^\n]+\n)|\Z)", re.MULTILINE)
    for match in pattern.finditer(content):
        spaces, title, entry_content = match.group(1), match.group(2), codify_yaml(match.group(3))
        entries.append(Entry(title=title, file=path, content=entry_content, spaces=spaces, type="yaml"))
    return entries


def split_json_entries(path: Path, content: str, should_trim: bool) -> List[Entry]:
    """Split content into entries based on regex matches"""
    entries = []
    pattern = re.compile(r"( *)\/\/ \^([^\n]+)\n([\s\S]*?)((?= *\/\/ \^[^\n]+\n)|\Z)", re.MULTILINE)
    for match in pattern.finditer(content):
        spaces, title, entry_content = match.group(1), match.group(2), codify_json(match.group(3))
        if should_trim:
            entry_content = trim_json(entry_content)
        entries.append(Entry(title=title, file=path, content=entry_content, spaces=spaces, type="json"))
    return entries


def read_entries(directory: Path, should_trim: bool, user_name: str) -> List[Entry]:
    """Read and return entries from all files in a directory"""
    entries = []
    for path in directory.rglob("*"):
        if path.is_file() and not any(
                sub in path.name for sub in [".vscode", ".idea", ".DS_Store"]) and not path.stem.endswith("!"):
            content = extract_file_content(path, user_name)
            if path.stem.endswith("合集") or path.stem.endswith("collection"):
                if path.suffix == ".yaml":
                    if content.startswith("# ^"):
                        entries.extend(split_yaml_entries(path, content, should_trim))
                    else:
                        raise RuntimeError(f"解析 '{path}' 出错, 你是不是忘了在开头加一行 '# ^条目名' 告知该部分内容是属于哪个条目")
                elif path.suffix == ".json":
                    if content.startswith("// ^"):
                        entries.extend(split_json_entries(path, content, should_trim))
                    else:
                        raise RuntimeError(f"解析 '{path}' 出错, 你是不是忘了在开头加一行 '// ^条目名' 告知该部分内容是属于哪个条目")
                continue

            if path.suffix == ".json":
                content = codify_json(content)
                if should_trim:
                    content = trim_json(content)

            if path.suffix == ".yaml":
                if should_trim:
                    content = to_flow_yaml(path)
                content = codify_yaml(content)
            entries.append(Entry(title=path.stem, file=path, content=content, spaces="", type="normal"))
    return entries


def write_entries(entries: List[Entry]):
    """Write entries to their respective files"""
    from itertools import groupby
    entries.sort(key=lambda x: x.file)

    for file, grouped_entries in groupby(entries, key=lambda x: x.file):
        content = ""
        entry_list = list(grouped_entries)
        type = entry_list[0].type
        if type == 'normal':
            content = entry_list[0].content
        else:
            for entry in entry_list:
                content += f"{entry.spaces}{'//' if entry.type == 'json' else '#'} ^{entry.title}\n{entry.content}"

        file.write_text(content, encoding="utf-8")


def read_json(json_file: Path) -> dict:
    """Read and return JSON data from a file"""
    with json_file.open(encoding="utf-8") as f:
        return json.load(f)


def write_json(json_file: Path, data: dict):
    """Write JSON data to a file with indentation"""
    with json_file.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def push_impl(directory: Path, json_data: dict, user_name: str, should_trim: bool) -> {bool, dict}:
    """Push file contents from directory into JSON entries"""
    entries = read_entries(directory, should_trim, user_name)

    changed = False

    unused_entries = set(entries)
    for entry in json_data.get("entries").values():
        title = entry.get("comment")
        matching_entry = next((e for e in entries if e.title == title), None)

        if matching_entry is None:
            raise RuntimeError(f"未找到酒馆世界书中条目 '{title}' 对应的文件, 请在世界书本地文件夹中创建它")

        if entry["content"] != matching_entry.content:
            entry["content"] = matching_entry.content
            changed = True
        unused_entries.discard(matching_entry)
    if unused_entries:
        error_message = "未能在酒馆世界书中找到以下条目, 请在酒馆世界书中创建这些条目:"
        for entry in unused_entries:
            error_message += f"\n- '{entry.title}': '{entry.file}'"
        raise RuntimeError(error_message)

    if json_data.get('originalData'):
        del json_data['originalData']
    return [changed, json_data]


def push(directory: Path, json_file: Path, user_name: str, should_trim: bool, need_confirm: bool):
    """Push file contents from directory into JSON entries"""
    if need_confirm:
        if not confirm_action("将文件推送到世界书"):
            print("取消推送")
            return

    json_data = read_json(json_file)
    [changed, json_data] = push_impl(directory, json_data, user_name, should_trim)
    if changed:
        write_json(json_file, json_data)
    print("成功推送")


def watch(directory: Path, lorebook_name: str, user_name: str, should_trim: bool, port: int = 6620):
    """Watch file contents from directory and push them into JSON entries"""
    import socketio
    import tornado.ioloop
    import tornado.web
    import watchfiles

    tornado.log.enable_pretty_logging()
    sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='tornado')
    app = tornado.web.Application([
        ('/socket.io/', socketio.get_tornado_handler(sio))
    ])

    async def push_once(reason):
        print('================================================================================')
        if reason:
            print(reason)

        async def update_lorebook(json_data: dict | None):
            if json_data:
                try:
                    [changed, json_data] = push_impl(directory, json_data, user_name, should_trim)
                    if changed:
                        await sio.emit('lorebook_updated', data={'name': lorebook_name, 'content': json.dumps(json_data)})
                    print(f"成功将更新推送到 '{lorebook_name}'")
                except Exception as error:
                    print(f'错误: {error}')
                except:
                    print('错误: 发生未知错误')
            else:
                print("错误: 未在酒馆网页中找到相应世界书")
            print('================================================================================')
        await sio.emit(event='request_lorebook_update', data={'name': lorebook_name}, callback=update_lorebook)

    @sio.event
    async def connect(sid, environ, auth):
        await push_once(f"成功连接到酒馆网页 '{sid}', 初始化推送...")

    @sio.event
    async def disconnect(sid, reason):
        print(f"与酒馆网页 '{sid}' 断开连接: {reason}")

    async def background_task():
        async for changes in watchfiles.awatch(directory):
            for [_, path] in changes:
                await push_once(f"检测到文件 '{path}' 变化, 进行推送...")
    sio.start_background_task(background_task)

    print(f'正在监听: http://0.0.0.0:{port} (按 Ctrl+C 退出)')
    app.listen(port=port)
    tornado.ioloop.IOLoop.current().start()


def uncodify_file(file_path, prefix):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.readlines()

    inside_block = False
    for i, line in enumerate(content):
        if re.match(r'<%\s*', line):  # Detect opening tag
            inside_block = True
        if inside_block:
            content[i] = f'{prefix}{line.strip()}\n'  # Prepend the custom prefix
        if re.match(r'.*%>\s*', line):  # Detect closing tag
            inside_block = False

    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(content)


def format_jsons(directory: Path):
    json_files = [str(json_path) for json_path in directory.rglob("*.json")]
    if json_files:
        try:
            for json_file in json_files:
                uncodify_file(json_file, '// :')
            subprocess.run(["clang-format", "-i"] + json_files, check=True, encoding="utf-8")
        except subprocess.CalledProcessError as e:
            print(f"格式化 json 失败: {e}")


def format_yamls(directory: Path):
    yaml_files = [str(yaml_path) for yaml_path in directory.rglob("**/*.yaml")]
    for yaml_file in yaml_files:
        try:
            uncodify_file(yaml_file, '# :')
            subprocess.run(["yq", '... style=""', "-i", yaml_file], check=True, encoding="utf-8")
        except subprocess.CalledProcessError as e:
            print(f"格式化 yaml 失败: {e}")


def pull(directory: Path, json_file: Path, user_name: str, need_confirm: bool):
    """Pull content from JSON entries and write to files in directory"""
    if need_confirm:
        if not confirm_action("将世界书拉取到文件"):
            print("取消拉取")
            return

    entries = read_entries(directory, user_name, False)
    json_data = read_json(json_file)

    for entry in json_data.get("entries").values():
        title = entry.get("comment")
        matching_entry = next((e for e in entries if e.title == title), None)
        if matching_entry is None:
            raise RuntimeError(f"未找到世界书中条目 '{title}' 对应的文件")

        matching_entry.content = entry.get("content", "")

    write_entries(entries)
    format_jsons(directory)
    format_yamls(directory)
    print("成功拉取")


def is_valid_file(content: str, extension: str):
    try:
        subprocess.run(["yq", "-p", extension.removeprefix('.'), "-"], check=True,
                       input=content, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
        return True
    except subprocess.CalledProcessError:
        return False


def is_valid_json(content: str):
    return is_valid_file(content, ".json")


def is_valid_yaml(content: str):
    return is_valid_file(content, ".yaml")


def extract(output_directory: Path, json_file: Path, detect: bool):
    """Extract content from JSON entries to a directory"""
    if not output_directory.exists():
        os.makedirs(output_directory)

    if len(os.listdir(output_directory)) != 0:
        raise RuntimeError(f"进行提取操作时, 配置文件中设定的独立文件文件夹 directory ({output_directory}) 必须为空文件夹!")

    if not confirm_action(f"将 {json_file} 提取到 {output_directory}"):
        print("取消提取")
        return

    json_data = read_json(json_file)

    for entry in json_data.get("entries").values():
        title = str(entry.get("comment"))
        if sys.platform in ['win32', 'cygwin'] and any(char in title for char in '\\/:*?"<>|'):
            raise RuntimeError(f'不能创建 \'${title}\' 文件, Windows 上文件不能包含以下任何字符: \\/:*?"<>|')
        if sys.platform == 'linux' and '/' in title:
            raise RuntimeError(f'不能创建 \'${title}\' 文件, Linux 上文件不能包含 / 字符')
        content = entry.get("content").strip()
        extension = ".md"

        if detect:
            if content.startswith("```json") and content.endswith("```"):
                content = content.removeprefix("```json").removesuffix("```").strip()
                extension = ".json"
            elif content.startswith("```yaml") and content.endswith("```"):
                content = content.removeprefix("```yaml").removesuffix("```").strip()
                extension = ".yaml"
            elif content:
                if is_valid_json(content):
                    extension = ".json"
                elif is_valid_yaml(content):
                    extension = ".yaml"

        file_path = os.path.join(output_directory, f"{title}{extension}")
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)

    if detect:
        format_jsons(output_directory)
        format_yamls(output_directory)
    print("成功提取")


def convert_extension(directory: Path, old: str, new: str, need_confirm: bool):
    """Convert all `old` extension files in a directory to `new` extension"""
    if need_confirm:
        if not confirm_action(f"将 {directory} 中所有 {old} 文件转换为 {new} 文件"):
            print("取消转换")
            return

    for path in directory.rglob("*"):
        if path.is_file():
            if path.suffix == old:
                try:
                    subprocess.run(
                        ["yq", '.. style=""', "-p", old.removeprefix('.'),
                         "-o", new.removeprefix('.'),
                         "-i", str(path)],
                        check=True, stdout=subprocess.PIPE, text=True, encoding="utf-8").stdout
                    os.rename(path, path.with_suffix(new))
                except subprocess.CalledProcessError:
                    continue


def to_json(directory: Path, need_confirm: bool):
    convert_extension(directory, ".yaml", ".json", need_confirm)


def to_yaml(directory: Path, need_confirm: bool):
    convert_extension(directory, ".json", ".yaml", need_confirm)


def load_or_create_config(config_path: Path) -> dict:
    """Load the JSON configuration file, or create an empty one if it doesn't exist"""
    if not config_path.exists():
        config_path.write_text("{}", encoding="utf-8")
        return {}

    with config_path.open("r", encoding="utf-8") as f:
        return yaml.load(f, Loader=yaml.Loader)


def publish(
        publish_directory: Path, character_card: Path = None, source_directory: Path = None, should_zip: bool = False,
        need_confirm: bool = True):
    """Publish cards into publish_directory"""
    publish_directory.mkdir(parents=True, exist_ok=True)  # Ensure directory exists

    PUBLISH_LIST = f"""- 角色卡: {character_card}
- 源文件文件夹: {source_directory}"""

    if need_confirm:
        response = input(f"""你确定要将以下文件发布到 {publish_directory} 文件夹下?
{PUBLISH_LIST}
(yes/no): """).strip().lower()
        if response != "yes":
            print("取消发布")
            return
    else:
        print(PUBLISH_LIST)

    # 拷贝角色卡
    if character_card is not None:
        try:
            shutil.copy(character_card, publish_directory)
            print(f"已复制角色卡到 {publish_directory}")
        except Exception as error:
            raise RuntimeError(f"复制角色卡失败, {error}")

    # 拷贝源文件文件夹
    if source_directory is not None:
        DESTINATION_DIRECTORY = publish_directory / "源文件"
        if DESTINATION_DIRECTORY.exists():
            send2trash.send2trash(DESTINATION_DIRECTORY)
            print(f"已将原本的 {DESTINATION_DIRECTORY} 移入回收站")

        DESTINATION_ZIP = publish_directory / "源文件.zip"
        if DESTINATION_ZIP.exists():
            send2trash.send2trash(DESTINATION_ZIP)
            print(f"已将原本的 {DESTINATION_ZIP} 移入回收站")

        README_CONTENT = """\
# 使用说明

本文件夹保存了编写角色卡/世界书/插件所使用的一些原始内容.

## 世界书

如果本源文件涉及世界书, 它通常是脚本自动同步过去省 token 的, 因此在酒馆里可能比较难看.
你可以直接看本源文件中的相关内容, 也可以搭配 https://sillytavern-stage-girls-dog.readthedocs.io/tool_and_experience/lorebook_script 查看

## 脚本

如果本源文件涉及代码脚本, 它可能是用 JavaScript 或 TypeScript 编写, 再使用打包软件打包到酒馆的, 因此在酒馆里可能比较难看.
你可以直接看本源文件中的相关内容, 也可以配着用 https://sillytavern-stage-girls-dog.readthedocs.io/tool_and_experience/js_slash_runner 查看.
"""

        if should_zip:
            with zipfile.ZipFile(DESTINATION_ZIP, 'w') as zf:
                for file in source_directory.rglob('*'):
                    if file.name != '.DS_Store':
                        zf.write(file, Path("世界书源文件") / file.relative_to(source_directory))
                zf.writestr("README.md", README_CONTENT)
        else:
            shutil.copytree(source_directory, DESTINATION_DIRECTORY)
            (DESTINATION_DIRECTORY / "README.md").write_text(README_CONTENT, encoding="utf-8")
            print(f"已拷贝 {source_directory} 到 {DESTINATION_DIRECTORY} 中")

    print("成功发布")


# -----------------------------------------------------------------------------------------------------------------------
def as_existing_folder(config, key):
    if not key in config:
        raise RuntimeError(f"配置文件中未配置 '{key}'")
    path = Path(config[key])
    if not path.exists():
        raise RuntimeError(f"配置文件中指定的 '{key}'({path}) 不存在")
    if not path.is_dir():
        raise RuntimeError(f"配置文件中指定的 '{key}'({path}) 不是文件夹")
    return path


def as_nonexisting_folder(config, key):
    if not key in config:
        raise RuntimeError(f"配置文件中未配置 '{key}'")
    path = Path(config[key])
    if path.exists() and not path.is_dir():
        raise RuntimeError(f"配置文件中指定的 '{key}'({path}) 不是文件夹")
    return path


def as_existing_file(config, key):
    if not key in config:
        raise RuntimeError(f"配置文件中未配置 '{key}'")
    path = Path(config[key])
    if not path.exists():
        raise RuntimeError(f"配置文件中指定的 '{key}'({path}) 不存在")
    if not path.is_file():
        raise RuntimeError(f"配置文件中指定的 '{key}'({path}) 不是文件")
    return path


def as_existing_string(config, key):
    if not key in config:
        raise RuntimeError(f"配置文件中未配置 '{key}'")
    return str(config[key])


def handle_extract(args, config):
    lorebook_directory = as_nonexisting_folder(config, '世界书本地文件夹')
    lorebook_file = as_existing_file(config, '世界书酒馆文件')
    extract(lorebook_directory, lorebook_file, not args.no_detect)


def handle_push(args, config):
    lorebook_directory = as_existing_folder(config, '世界书本地文件夹')
    lorebook_file = as_existing_file(config, '世界书酒馆文件')
    user_name = config.get('玩家名')
    push(lorebook_directory, lorebook_file, user_name, not args.no_trim, not args.y)


def handle_watch(args, config):
    lorebook_directory = as_existing_folder(config, '世界书本地文件夹')
    try:
        lorebook_name = as_existing_file(config, '世界书酒馆文件').stem
    except:
        lorebook_name = as_existing_string(config, '世界书名称')
    user_name = config.get('玩家名')
    watch(lorebook_directory, lorebook_name, user_name, not args.no_trim, args.port)


def handle_pull(args, config):
    lorebook_directory = as_existing_folder(config, '世界书本地文件夹')
    lorebook_file = as_existing_file(config, '世界书酒馆文件')
    user_name = config.get('玩家名')
    pull(lorebook_directory, lorebook_file, user_name, not args.y)


def handle_publish(args, config):
    publish_directory = as_nonexisting_folder(config, '发布目标文件夹')

    character_card = None
    if '角色卡' in config:
        character_card = as_existing_file(config, '角色卡')

    source_directory = None
    if '源文件文件夹' in config:
        source_directory = as_existing_folder(config, '源文件文件夹')

    publish(publish_directory, character_card, source_directory, args.should_zip, not args.y)


def handle_to_json(args, config):
    lorebook_directory = as_existing_folder(config, '世界书本地文件夹')
    to_json(lorebook_directory, not args.y)


def handle_to_yaml(args, config):
    lorebook_directory = as_existing_folder(config, '世界书本地文件夹')
    to_yaml(lorebook_directory, not args.y)


def main():
    configs = load_or_create_config(Path(__file__).parent / "tavern_sync_config.yaml")

    parser = argparse.ArgumentParser(description="分文件修改世界书脚本, 具体说明请查看: ")
    subparsers = parser.add_subparsers(dest="command")

    commands = ["extract", "push", "watch", "pull", "publish", "to_json", "to_yaml"]

    for command in commands:
        subparser = subparsers.add_parser(command, help=f"{command} 的帮助信息")
        subparser.add_argument("config_name", choices=configs.keys(), help="配置文件中的配置名称")
        subparser.add_argument("-y", action="store_true", help="启用时, 不再需要手动输入 'yes' 确认")

    extract_parser = subparsers.choices["extract"]
    extract_parser.add_argument("--no_detect", action="store_true", help="启用时, 提取世界书时不会检测条目内容格式并自动转换为 json 或 yaml")

    push_parser = subparsers.choices["push"]
    push_parser.add_argument("--no_trim", action="store_true", help="启用时, 推送到世界书时将不会删除空白符来节省 token")

    watch_parser = subparsers.choices["watch"]
    watch_parser.add_argument("--no_trim", action="store_true", help="启用时, 推送到世界书时将不会删除空白符来节省 token")
    watch_parser.add_argument("--port", default="6620", help="监听的端口号, 默认为 6620")

    publish_parser = subparsers.choices["publish"]
    publish_parser.add_argument("--should_zip", action="store_true", help="启用时, 不是直接拷贝整个文件夹到发布目标文件夹, 而是在发布目标文件夹生成一个压缩包")

    args = parser.parse_args()

    command_handlers = {
        "extract": handle_extract,
        "push": handle_push,
        "watch": handle_watch,
        "pull": handle_pull,
        "publish": handle_publish,
        "to_json": handle_to_json,
        "to_yaml": handle_to_yaml,
    }

    if args.command in command_handlers:
        command_handlers[args.command](args, configs[args.config_name])
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
