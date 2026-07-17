const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const submitBtn = document.getElementById('submit-btn');
const resultBox = document.getElementById('result-box');

let selectedFile = null;

// 點擊區域觸發選擇檔案
dropZone.addEventListener('click', () => fileInput.click());

// 選擇檔案事件
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// 拖曳相關事件
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => dropZone.classList.remove('drag-over'));
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('video/')) {
      handleFile(file);
    } else {
      alert('請上傳有效的影片檔案！');
    }
  }
});

// 處理選擇檔案
function handleFile(file) {
  selectedFile = file;
  fileInfo.textContent = `已選擇：${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  submitBtn.disabled = false;
}

// 送出到 Hugging Face Space 後端
submitBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '處理中，請稍候...';
  resultBox.style.display = 'none';

  try {
    // ⚠️ 替換成您的 帳號/Space名稱 (例如 "username/my-video-app")
    const app = await window.gradioClient("YOUR_HF_USERNAME/YOUR_SPACE_NAME");

    // 傳送影片資料給 Gradio 的 /predict 端點
    const result = await app.predict("/predict", [selectedFile]);

    resultBox.style.display = 'block';
    resultBox.textContent = "處理完成！後端回傳：\n" + JSON.stringify(result.data, null, 2);
  } catch (error) {
    console.error("呼叫 HF Space 失敗:", error);
    alert("處理過程發生錯誤，請查看 Console 訊息。");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '開始處理影片';
  }
});