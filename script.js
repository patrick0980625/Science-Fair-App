const RENDER_API_URL = "https://science-fair-app-2pzk.onrender.com/process-video";

const inputSection = document.getElementById("input-section");
const outputSection = document.getElementById("output-section");
const videoInput = document.getElementById("video-input");
const fileNameText = document.getElementById("file-name-text");
const submitBtn = document.getElementById("submit-btn");
const statusText = document.getElementById("status-text");
const downloadBtn = document.getElementById("download-btn");
const resetBtn = document.getElementById("reset-btn");
const loadingSpinner = document.getElementById("loading-spinner");

videoInput.addEventListener("change", () => {
  if (videoInput.files.length > 0) {
    const filename = videoInput.files[0].name;
    fileNameText.innerHTML = `已選取：<br><strong style="color: #2b6cb0">${filename}</strong>`;
    statusText.innerHTML = '';
  } else {
    fileNameText.innerText = '點擊或拖曳影片至此處';
  }
})

submitBtn.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) {
    statusText.style.color = "#e53e3e";
    statusText.innerText = "請先選取要處理的影片檔案";
    return;
  }

  loadingSpinner.classList.remove("hidden");
  submitBtn.disabled = true;
  statusText.style.color = "#4a5568";
  statusText.innerText = "影片上傳與處理中...（若伺服器休眠，第一次需等待約 30 秒喚醒）";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(RENDER_API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => {});
      const detailMsg = errorData.detail || `伺服器回應錯誤 (狀態碼: ${response.status})`
      statusText.style.color = "#e53e3e";
      statusText.innerText = detailMsg;
      return;
    }

    const blob = await response.blob();
    downloadBtn.href = URL.createObjectURL(blob);

    inputSection.classList.add("hidden");
    outputSection.classList.remove("hidden");

  } catch (error) {
    statusText.style.color = "#e53e3e";
    statusText.innerText = "發生錯誤";
  } finally {
    loadingSpinner.classList.add("hidden");
    submitBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", () => {
  videoInput.value = "";
  statusText.innerText = "";
  outputSection.classList.add("hidden");
  inputSection.classList.remove("hidden");
});