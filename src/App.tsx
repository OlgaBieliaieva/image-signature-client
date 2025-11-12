import React, { useState } from "react";
import EditorCanvas from "./components/EditorCanvas";
import SignaturePadComp from "./components/SignaturePad";
import axios from "axios";
import "./App.css";

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [signatureDrawn, setSignatureDrawn] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("Тут ваш текст");
  const [fileType, setFileType] = useState<"image" | "pdf">("image");

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleExport = async (canvasBlob: Blob) => {
    const fd = new FormData();
    fd.append("image", canvasBlob, "canvas.png");

    try {
      const resp = await axios.post(`${BACKEND_URL}/api/create-pdf`, fd, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([resp.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "signed.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error saving PDF", err);
      alert("Помилка при створенні PDF. Перевірте лог бекенду.");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">🖋️ Signify</div>

        <div className="file-options">
          <div>
            <label>Тип документа:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as "image" | "pdf")}
            >
              <option value="image">Зображення</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <label className="upload-btn">
            Завантажити {fileType === "image" ? "зображення" : "PDF"}
            <input
              type="file"
              accept={fileType === "image" ? "image/*" : "application/pdf"}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <h3>Інструменти</h3>

          <div className="form-section">
            <label>Текст (можна перетягувати):</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введіть текст..."
            />
          </div>

          <div className="form-section">
            <label>Намалювати підпис:</label>
            <SignaturePadComp onChange={setSignatureDrawn} />
          </div>

          <div className="form-section">
            <label>Або завантажити підпис:</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
            />
          </div>

          <p className="hint">
            💡 Порада: коліщатком можна змінювати масштаб підпису
          </p>
        </aside>

        <main className="editor-area">
          {imageFile ? (
            <EditorCanvas
              imageFile={imageFile}
              text={text}
              signatureDrawn={signatureDrawn}
              signatureFile={signatureFile}
              onExport={handleExport}
            />
          ) : (
            <div className="empty-state">
              Завантажте {fileType === "image" ? "зображення" : "PDF"}, щоб
              почати роботу
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
