import {useState} from 'react';
import logo from './assets/images/image.svg';
import {SelectFile, CompressFile} from "../wailsjs/go/main/App";
import {main} from "../wailsjs/go/models"

function App() {
    const [file, setFile] = useState<main.FileInfo>()
    function selectFile() {
        console.log('selecting file')
        SelectFile().then((res: main.FileInfo | Error) => {
            if (res instanceof Error) {
                alert(res.message)
                console.log('error after selecting file', res)
                return
            }

            setFile(res)
            console.log('setting file', res)
        }).catch((reason: any) =>
            console.log('error selecting file: reason', reason)
        );
    }


    return (
        <div id="app" className="min-h-screen text-center grid items-center p-8">
            <div>
                <img
                    src={logo} id="logo" alt="logo"
                    className={"my-4 block w-1/2 max-h-1/2 h-auto m-auto bg-center bg-no-repeat bg-cover pb-6" + (file ? " hidden " : "")}
                />
                <SelectFileButton callback={selectFile} fileSelected={!!file} />
                {file ? <CompressionOptionsForm file={file} callback={() => setFile(undefined)} /> : ""}
            </div>
        </div>
    )
}

const SelectFileButton: React.FC<{
    fileSelected: boolean,
    callback: () => void
}> = ({fileSelected, callback}) => (
    <button className="bg-gray-800 semibold text-white py-2 px-4 rounded" onClick={callback}>
        {fileSelected ? 'Select another file' : 'Select a file'}
    </button>
)

const CompressionOptionsForm: React.FC<{
    file: main.FileInfo,
    callback: () => void
}> = ({file, callback}) => {
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = event.target
        if (!(form instanceof HTMLFormElement)) {
            alert('error with submission')
            return
        }

        console.log('form', form)
        const isValid = form.reportValidity()
        if (!isValid) return;

        const options = main.CompressionOptions.createFrom({
            original_file_path: file.path,
            original_file_name: file.name,
            quality: parseInt(form["quality"].value),
            max_width: parseInt(form["max_width"].value),
            max_height: parseInt(form["max_height"].value),
        })

        console.log('options', options)
        CompressFile(options).then((err: Error) => {
            console.log('error compressing file', err)
            callback()
        })
    }

    return (
        <form onSubmit={submit} className="text-left" id="compression-options-form">
            <div className={'my-4' + (file.image_format == 'jpeg' ? '' : 'hidden')}>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700">
                    Quality
                </label>
                <div className="mt-1">
                    <input
                        type="number" max="100" min="1"
                        defaultValue="70"
                        name="quality"
                        id="quality"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        aria-describedby="quality-description"
                    />
                </div>
                <p className="mt-2 text-sm text-gray-500" id="quality-description">
                    The quality of the compressed image. 1-100
                </p>
            </div>
            <div className="my-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="quality" className="block text-sm font-medium text-gray-700">
                        Maximum Width
                    </label>
                    <div className="mt-1">
                        <input
                            type="number" min="1" max={file.width}
                            defaultValue={file.width > 1000 ? 1000 : file.width}
                            name="max_width"
                            id="max_width"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            aria-describedby="max_width-description"
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500" id="max_width-description">
                        The maximum width of the compressed image
                    </p>
                </div>
                <div>
                    <label htmlFor="quality" className="block text-sm font-medium text-gray-700">
                        Maximum Height
                    </label>
                    <div className="mt-1">
                        <input
                            type="number" min="1" max={file.height}
                            defaultValue={file.height > 1000 ? 1000 : file.height}
                            name="max_height"
                            id="max_height"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            aria-describedby="max_height-description"
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500" id="max_height-description">
                        The maximum height of the compressed image
                    </p>
                </div>
            </div>
            <button className="bg-gray-800 semibold text-white py-2 px-4 rounded" type="submit">
                Submit
            </button>
        </form>
    )
}


export default App
