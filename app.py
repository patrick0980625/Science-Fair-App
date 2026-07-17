from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import zipfile
import os

app = FastAPI()

# 允許跨域 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Temporary Backend is Running!"}

@app.post("/process-video")
async def process_video(file: UploadFile = File(...)):
    # 建立一個測試用的文字檔
    test_txt = "test_frame.txt"
    with open(test_txt, "w", encoding="utf-8") as f:
        f.write("這是一個測試幀檔案，代表 API 與打包流程成功運作！")

    # 打包成 ZIP
    zip_path = "output_frames.zip"
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        zipf.write(test_txt, arcname="frame_001.txt")

    # 刪除測試文字檔，回傳 ZIP
    if os.path.exists(test_txt):
        os.remove(test_txt)

    return FileResponse(zip_path, media_type="application/zip", filename="output_frames.zip")