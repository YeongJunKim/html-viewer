// FileList.js

import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';
import axios from 'axios';
import './FileList.css';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import PCDViewer from './PCDViewer';

// import { useSearchParams, useLocation } from 'react-router-dom';
// import { toast } from 'react-toastify';

// toast.configure();

const FileList = () => {
    // const location = useLocation();
    // const queryParams = new URLSearchParams(location.search);
    // const paramValue = queryParams.get('serverAddress');
    // const [searchParams] = useSearchParams();
    // const query = searchParams.get('query'); // test
    // const defaultServerUrl = 'http://localhost:9999';
    const defaultServerUrl = 'http://192.168.100.208:9999';
    const [serverAddressText, setServerAddressText] = useState(defaultServerUrl);
    const [fileList, setFileList] = useState([]);
    const [thumbnailList, setThumbnailList] = useState([]);
    const [currentCommit, setCurrentCommit] = useState('');
    const [branchList, setBranchList] = useState([]);
    const [currentFile, setCurrentFile] = useState('');
    const [renderedHtmlUrl, setRenderedHtmlUrl] = useState('');
    const [tableHeight, setTableHeight] = useState('');
    const [serverAddress, setServerAdress] = useState(defaultServerUrl);
    const [branchTableVisibility, setBranchTableVisibility] = useState(false);
    const [fileTableVisibility, setFileTableVisibility] = useState(false);
    const [tableVisibility, setTableVisibility] = useState(false);
    const [rightWidth, setRightWidth] = useState('75%');

    const [nowBranch, setNowBranch] = useState('');
    const [myParam, setMyParam] = useState('');

    const [title, setTitle] = useState("title");
    useEffect(() => {document.title = title;}, [title]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paramValue = params.get('serverAddress');
        const isAutoFetch = params.get('autoFetch');
        setServerAdress(paramValue);

        const updateTableHeight = () => {
            const windowHeight = window.innerHeight;
            setTableHeight(`${windowHeight - 50}px`);
        };
        // setServerAddressText({paramValue})
        updateTableHeight();
        window.addEventListener('resize', updateTableHeight);
        return () => {
            window.removeEventListener('resize', updateTableHeight);
        };
    }, []); // 빈 배열을 전달하여 컴포넌트가 마운트될 때 한 번만 실행


    const handleDividerDrag = (e) => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const containerWidth = document.getElementById('main_container').offsetWidth;
        const newRightWidth = `${100 - (e.clientX / containerWidth) * 100}%`;
        // setLeftWidth(newLeftWidth);
        setRightWidth(newRightWidth);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const requestFileList = async () => {
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/file_list`);
            setFileList(response.data.files);
            setFileTableVisibility(true);
        } catch (error) {
            alert("Check server state and port");
            console.error('Error fetching file list:', error.message);
        }
    }

    const reqeustBranchList = async () => {
        try {
            // Flask 서버의 파일 목록 엔드포인트에 GET 요청 보내기
            const response = await axios.get(`${serverAddress}/branch_list`);
            const branches = response.data.branches
            console.log(response)
            console.log(`branches: ${branches}`)
            setBranchList(branches);
            setBranchTableVisibility(true);
        } catch (error) {
            alert("Check server state and port");
            console.error('Error fetching file list:', error.message);
        }
    }

    const reqestResetThumbnail = async () => {
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/thumbnail_reset_by_commit/${currentCommit}`);
        } catch (error) {

        }
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/thumbnail_list_by_commit/${currentCommit}`);
            setThumbnailList(response.data.thumbnails)
            console.log(response)
        } catch (error) {

        }
    }

    const requestDeleteFiles = async () => {
        const warnUser = () => {
            // toast.warn('Are you sure you want to delete files?')
        }
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/delete_files_by_commit/${currentCommit}`);
        } catch (error) {

        }
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/file_list_by_commit/${currentCommit}`);
            // const sortedFiles = response.data.files.sort((a, b) => a.localeCompare(b));
            setFileList(response.data.files);
            setFileTableVisibility(true);
        } catch (error) {
            alert("Check server state and port");
            console.error('Error fetching file list:', error.message);
        }
    }

    const fileListClear = () => {
        setFileList([])
        setCurrentCommit("")
        setBranchList([])
        setFileTableVisibility(false);
        setBranchTableVisibility(false);
    }

    // 파일에 대한 작업 수행 함수
    const handleFileAction = async (fileName) => {
        // 원하는 작업을 수행 (예: 파일 다운로드, 수정, 삭제 등)
        console.log(`Performing action on file: ${fileName}`);
        try {
            // Flask 서버의 파일 읽기 엔드포인트에 GET 요청 보내기
            const response = await axios.get(`${serverAddress}/read_file/${currentCommit}/${fileName}`, { responseType: 'blob' });

            // 파일 내용을 다운로드
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            // document.body.removeChild(link);
        } catch (error) {
            alert("Check server state and port");
            console.error('Error reading file:', error.message);
        }
    };

    const handleSetBranch = async (tag) => {
        console.log(`Performing action on tag: ${tag}`)
        setNowBranch(tag)
        console.log(nowBranch)
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/file_list_by_commit/${tag}`);
            // const sortedFiles = response.data.files.sort((a, b) => a.localeCompare(b));
            setFileList(response.data.files);
            setCurrentCommit(tag);
            setFileTableVisibility(true);
        } catch (error) {
            alert("Check server state and port");
            console.error('Error fetching file list:', error.message);
        }
        try {
            console.log(serverAddress)
            const response = await axios.get(`${serverAddress}/thumbnail_list_by_commit/${tag}`);
            setThumbnailList(response.data.thumbnails)
            console.log(response)
        } catch (error) {

        }
    };

    const handleReadFile = async (fileName) => {
        console.log(`Performing action on file:${fileName}`);
        try {
            let response;
            if (currentCommit == "") {
                response = await axios.get(`${serverAddress}/read_file/${fileName}`);
            }
            else {
                response = await axios.get(`${serverAddress}/read_file/${currentCommit}/${fileName}`);
            }

            setCurrentFile(fileName);

            if (fileName.toLowerCase().endsWith('.pcd')) {
                const blob = new Blob([response.data], { type: 'application/octet-stream' });
                console.log(blob)
                setRenderedHtmlUrl(blob);

            }
            else {
                const blob = new Blob([response.data], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                setRenderedHtmlUrl(url);
            }

        } catch (error) {
            alert("Check server state and port");
            console.error('Error reading file:', error.message);
        }
    };



    const handleTextChange = (e) => {
        setServerAddressText(e.target.value);
    };

    // 입력 변경 핸들러
    const ServerNameInputChange = (e) => {
        setTitle(e.target.value);
        document.title = e.target.value;
    };

    const SeverAdressInputChange = (e) => {
        setServerAdress(e.target.value);
    };

    return (
        <div id="main_container" className="main_container">
            <div className="left" style={{ width: `calc(100% - ${rightWidth})` }}>
                <div className='setting_container'>

                    <div className='server_input_container'>
                        <label className='server_input'>
                            server Name:
                            <div style={{ flex: '1' }}></div>

                            <input type="text" value={title} onChange={ServerNameInputChange} />
                        </label>
                        <label className='server_input'>
                            server Address:
                            <div style={{ flex: '1' }}></div>

                            <input type="text" value={serverAddress} onChange={SeverAdressInputChange} />
                        </label>
                    </div>
                    <div className='branch_table_container'>
                        <table style={{ visibility: branchTableVisibility ? 'visible' : 'hidden' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Branch</th>
                                    <th style={{ width: '60%', fontSize: '12px' }}>Commit or Folder</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchList.map((branch_info, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className='file_name_container'>
                                                <div className='file_name_container_index'>
                                                    {index}
                                                </div>
                                                <div className='branch_name_container_file_name'>
                                                    {branch_info[0]}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className='commit'>
                                                <text>
                                                    {branch_info[1]}
                                                </text>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table_action_button_container">
                                                <button onClick={() => handleSetBranch(branch_info[1])}>Get List</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className='file_name_table_container'>
                        <table style={{ visibility: fileTableVisibility ? 'visible' : 'hidden', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th><div></div></th>
                                    <th><div></div></th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileList.map((fileName, index) => (
                                    <tr key={index}>
                                        <td style={{ width: '130px' }}>
                                            <img key={index} src={`data:image/jpeg;base64,${thumbnailList[fileName]}`} alt={`Thumbnail ${index}`} className='file_name_container_image'></img>
                                        </td>
                                        <td>
                                            <div className='file_name_container'>
                                                <div className='file_name_container_index'>
                                                    {index}
                                                </div>
                                                <div className='file_name_container_file_name'>
                                                    {fileName}
                                                </div>
                                            </div>
                                        </td>

                                        <td width={70}>
                                            <div className="table_action_button_container">
                                                <button onClick={() => handleFileAction(fileName)}>Download</button>
                                                <div style={{ width: '3px' }}></div>
                                                <button onClick={() => handleReadFile(fileName)}>Display</button>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ flex: 1 }}></div>
                    <div>
                        <span style={{ fontSize: 15, fontFamily: 'd2coding', color: 'red' }}>
                            {currentCommit}
                        </span>
                    </div>
                    <div className='main_button_container'>
                        {/* <button className='fetch_file' onClick={() => requestFileList()}>Fetch File List</button> */}
                        <button className='main_button' onClick={() => reqeustBranchList()}>Fetch Branch List</button>
                        <button className='main_button' onClick={() => fileListClear()}>Clear</button>
                        <button className='main_button' onClick={() => reqestResetThumbnail()}>Reset Thumbnail</button>
                        <button className='main_danger_button' onClick={() => requestDeleteFiles()}>Delete Files</button>
                    </div>
                </div>
            </div>
            {/* <div className="vertical-line"></div> */}
            <div className="divider" onMouseDown={handleDividerDrag}></div>
            <div className="right2" style={{ width: rightWidth }}>

                {currentFile && currentFile.toLowerCase().endsWith('.pcd') ? (
                    <PCDViewer blob={renderedHtmlUrl}/>
                ) : (
                    <iframe title="Rendered HTML" src={renderedHtmlUrl} className="iframe100" />
                )}
                {/* <PCDViewer pcdUrl={renderedHtmlUrl} dataset={currentFile} />
                <iframe title="Rendered HTML" src={renderedHtmlUrl} className="iframe100">
                </iframe> */}
                

            </div>
        </div>
    );
};

export default FileList;