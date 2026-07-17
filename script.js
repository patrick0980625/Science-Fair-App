const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const submitBtn = document.getElementById('submit-btn');

let selectedFile = null;

// 點擊觸發檔案選擇器
dropZone.addEventListener('click', () => fileInput.click());

// 選擇檔案後觸發
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// 拖曳相關事件處理
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => {
    dropZone.classList.remove('drag-over');
  });
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

// 更新檔案選擇狀態
function handleFile(file) {
  selectedFile = file;
  fileInfo.textContent = `已選擇檔案：${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  submitBtn.disabled = false;
}

// 3. 送出到 Hugging Face 後端邏輯
submitBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '處理中...';

  // TODO: 接 Hugging Face 的後端
  // 如果是用 @gradio/client 或 Fetch API 呼叫 Spaces:
  console.log('準備將影片傳送到 Hugging Face:', selectedFile);

  /* 範例 API 串接架構：
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch('YOUR_HUGGINGFACE_SPACE_API_URL', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error('上傳失敗:', error);
  }
  */
});