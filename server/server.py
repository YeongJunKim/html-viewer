import argparse
import os
from glob import glob
from pathlib import Path
from io import BytesIO
from flask import Flask, jsonify, send_file
from flask_cors import CORS
import zipfile
from PIL import Image
import base64

app = Flask(__name__)
CORS(app)

def delete_files_in_folder(folder_path):
    # 폴더 내부의 모든 파일 리스트를 가져옴
    files = os.listdir(folder_path)
    
    # 각 파일을 순회하면서 삭제
    for file in files:
        file_path = os.path.join(folder_path, file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)  # 파일 삭제
            elif os.path.isdir(file_path):
                # 하위 폴더가 있다면 재귀적으로 삭제
                delete_files_in_folder(file_path)
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")

def get_folders(parent_folder):
    folders_without_subfolders = []
    for foldername, subfolders, filenames in os.walk(parent_folder):
        files = glob(f"{foldername}/*.html")
        files += glob(f"{foldername}/*.pcd")
        if len(files) == 0:
            continue
        
        if "intersections" in foldername:
            continue
        
        if "thumbnails" in foldername:
            continue
        
        if foldername.split("/")[-2] == "master":
            a = ["master", foldername.split("/")[-1]]
        else:
            a = [f"{foldername.split('/')[-3]}/{foldername.split('/')[-2]}", foldername.split("/")[-1]]
            
        folders_without_subfolders.append(a)
    return folders_without_subfolders

def get_folders_without_subfolders(parent_folder):
    folders_without_subfolders = []
    for foldername, subfolders, filenames in os.walk(parent_folder):
        if not subfolders:
            a = []
            if foldername.split("/")[-2] == "master":
                a = ["master", foldername.split("/")[-1]]
            elif foldername.split("/")[-1] == "thumbnails":
                a = [f"{foldername.split('/')[-4]}/{foldername.split('/')[-3]}", foldername.split("/")[-2]]
            else:
                a = [f"{foldername.split('/')[-3]}/{foldername.split('/')[-2]}", foldername.split("/")[-1]]
            folders_without_subfolders.append(a)
    return folders_without_subfolders

def get_folder_path_by_commit(parent_folder, commit):
    for foldername, subfolders, filenames in os.walk(parent_folder):
        if foldername.split("/")[-1] == commit:
            return foldername
    return ""

@app.route("/file_list_by_commit/<commit>")
def get_file_list_by_commit(commit):
    try:
        path = get_folder_path_by_commit(app.config['LOCAL_DIRECTORY'], commit)
        files = glob(f"{path}/*.html")
        files += glob(f"{path}/*.pcd")
        names = []
        for f in files:
            # file_name = Path(f).name.split(".")
            # file_name = ".".join(file_name[:-1])
            file_name = Path(f).name
            print(file_name)
            names.append(file_name)
        names = sorted(names)
        print(names)
        return jsonify({"files": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/delete_files_by_commit/<commit>")
def delete_files_by_commit(commit):
    try:
        path = get_folder_path_by_commit(app.config['LOCAL_DIRECTORY'], commit)
        print(path)
        delete_files_in_folder(path)
    except:
        pass
    return jsonify({'status': commit})

@app.route("/thumbnail_reset_by_commit/<commit>")
def reset_thumbnail_list_by_commit(commit):
    try:
        path = get_folder_path_by_commit(app.config['LOCAL_DIRECTORY'], commit) + "/thumbnails"
        print(path)
        delete_files_in_folder(path)
    except:
        pass
    return jsonify({'status': commit})

@app.route("/thumbnail_list_by_commit/<commit>")
def get_thumbnail_list_by_commit(commit):
    try:
        path = get_folder_path_by_commit(app.config['LOCAL_DIRECTORY'], commit)
        files = glob(f"{path}/*.png")
        
        Path(f"{path}/thumbnails").mkdir(exist_ok=True)
        
        for file in files:
            with open(file, 'rb') as f:
                file_name = Path(file).name
                thumbnail_path = f"{path}/thumbnails/{file_name}"
                if Path(thumbnail_path).is_file():
                    print("exist file: ", file)
                    continue
            
                print(file)
                img = Image.open(file)
                img.thumbnail((150,150))
                img.save(thumbnail_path)
        
        thumb_path = f"{path}/thumbnails"
        thumb_files = glob(f"{thumb_path}/*.png")
        
        # print("files", files)
        thumbnails = {}
        for file in thumb_files:
            with open(file, 'rb') as f:
                file_name = Path(file).name.split(".")
                file_name = ".".join(file_name[:-1])
                encoded_image = base64.b64encode(f.read()).decode('utf-8')
                # thumbnails.append({'id': file_name, 'data': encoded_image})
                thumbnails[file_name] = encoded_image
        return jsonify({'thumbnails': thumbnails})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/file_list")
def get_file_list():
    try:
        files = glob(f"{app.config['LOCAL_DIRECTORY']}/*.html")
        names = []
        for f in files:
            names.append(Path(f).name)
        return jsonify({"files": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/branch_list")
def get_branch_list():
    branches = get_folders(app.config["LOCAL_DIRECTORY"])
    print(branches)
    return_branches = []
    for branch in branches:
        # print(branch)
        if "thumbnails" not in branch:
            return_branches.append(branch)
    return jsonify({"branches": return_branches})

@app.route("/read_file/<commit>/<filename>")
def read_file_by_commit(commit, filename):
    try:
        path = get_folder_path_by_commit(app.config['LOCAL_DIRECTORY'], commit)
        file_path = os.path.join(path, filename)
        # file_path = file_path + ".html"
        print(file_path)
        return send_file(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        

@app.route("/read_file/<filename>")
def read_file(filename):
    try:
        file_path = os.path.join(app.config["LOCAL_DIRECTORY"], filename)
        print(file_path)
        return send_file(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="html viewer server", description="desc.")
    parser.add_argument("-p", "--port", default="3001")
    parser.add_argument("-d", "--dir", default="./results")
    parser.add_argument("-s", "--host", default="127.0.0.1")
    args = parser.parse_args()

    app.config["LOCAL_DIRECTORY"] = args.dir
    app.run(debug=True, port=args.port, host=args.host)
