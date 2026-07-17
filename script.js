const RENDER_API_URL = "https://science-fair-app-2pzk.onrender.com/process-video";

const inputSection = document.getElementById("input-section");
const outputSection = document.getElementById("output-section");
const videoInput = document.getElementById("video-input");
const submitBtn = document.getElementById("submit-btn");
const statusText = document.getElementById("status-text");
const downloadBtn = document.getElementById("download-btn");
const resetBtn = document.getElementById("reset-btn");

submitBtn.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) {
    alert("請先選擇影片檔案！");
    return;
  }

  // 1. 打包檔案格式
  const formData = new FormData();
  formData.append("file", file);

  // 2. 更新 UI 狀態為載入中
  submitBtn.disabled = true;
  statusText.innerText = "影片上傳與處理中...（若伺服器休眠，第一次需等待約 30 秒喚醒）";

  try {
    // 3. 發送 API 請求給 Render 後端
    const response = await fetch(RENDER_API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`伺服器回應錯誤 (狀態碼: ${response.status})`);
    }

    // 4. 接收回傳的 ZIP 檔並轉換成可下載的 Blob 連結
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    // 5. 將下載網址綁定給「下載按鈕」
    downloadBtn.href = downloadUrl;

    // 6. 畫面跳轉：隱藏輸入區塊，顯示輸出區塊
    inputSection.classList.add("hidden");
    outputSection.classList.remove("hidden");

  } catch (error) {
    console.error("Error:", error);
    alert("處理失敗，請確認 Render 後端運作正常或查看開發者工具主機日誌。");
    statusText.innerText = "";
  } finally {
    submitBtn.disabled = false;
  }
});

// 重置按鈕：清空檔案並回到上傳畫面
resetBtn.addEventListener("click", () => {
  videoInput.value = "";
  statusText.innerText = "";
  outputSection.classList.add("hidden");
  inputSection.classList.remove("hidden");
});