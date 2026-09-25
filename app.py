from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from core.detect import BladeAnalyzer
import shutil
import os
import zipfile

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)

analyzer = BladeAnalyzer()

class VideoProcessor:
    def __init__(self, video_filename: str):
        self.video_filename = video_filename
        self.session_id = os.path.splitext(video_filename)[0]
        self.temp_dir = "temp"
        self.output_dir = os.path.join("frames", self.session_id)
        self.zip_path = f"output_{self.session_id}.zip"
        self.video_path = os.path.join(self.temp_dir, f"{self.session_id}_{video_filename}")

        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

    def save_uploaded_file(self, upload_file: UploadFile):
        with open(self.video_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

    def run_algorithm(self) -> int:
        saved_count = analyzer.process_video_for_modeling(
            video_path=self.video_path,
            output_base_dir=self.output_dir,
        )
        return saved_count

    def create_zip_archive(self) -> str:
        with zipfile.ZipFile(self.zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(self.output_dir):
                for f in files:
                    full_path = os.path.join(root, f)
                    arcname = os.path.relpath(full_path, self.output_dir)
                    zipf.write(full_path, arcname=arcname)
        return self.zip_path

    def cleanup(self):
        if os.path.exists(self.video_path):
            os.remove(self.video_path)
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir, ignore_errors=True)

@app.get("/")
def home():
    return {"status": "Blade Analysis Backend is running"}


@app.post("/process-video")
async def process_video(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
        raise HTTPException(status_code=400, detail="Invalid file type")
    processor = VideoProcessor(video_filename=file.filename)

    try:
        processor.save_uploaded_file(file)
        save_count = processor.run_algorithm()
        if save_count == 0:
            raise HTTPException(status_code=422, detail="Fail to recognize blades match angle")

        zip_file_to_send = processor.create_zip_archive()

        return FileResponse(
            zip_file_to_send,
            media_type="application/zip",
            filename= f"frames_{processor.session_id}.zip"
        )
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    finally:
        processor.cleanup()