import { useEffect, useState } from "react";
import { pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PdfSigner() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [canvases, setCanvases] = useState<HTMLCanvasElement[]>([]);

  useEffect(() => {
    if (pdfFile) renderAllPages();
  }, [pdfFile]);

  const renderAllPages = async () => {
    const pdfData = await pdfFile!.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
    const rendered: HTMLCanvasElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      rendered.push(canvas);
    }
    setCanvases(rendered);
  };

  const addSignature = async (pageIndex: number, e: React.MouseEvent) => {
    if (!signature) return;
    const canvas = canvases[pageIndex];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = URL.createObjectURL(signature);
    img.onload = () => ctx.drawImage(img, x, y, 150, 80);
  };

  const exportToPdf = async () => {
    const pdfDoc = await PDFDocument.create();

    for (const canvas of canvases) {
      const imgData = canvas.toDataURL("image/png");
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      const png = await pdfDoc.embedPng(imgData);
      page.drawImage(png, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signed.pdf";
    a.click();
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
      />
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => setSignature(e.target.files?.[0] || null)}
      />
      <div className="my-4 space-y-4">
        {canvases.map((canvas, i) => (
          <div key={i}>
            <p>Сторінка {i + 1}</p>
            <canvas
              width={canvas.width}
              height={canvas.height}
              onClick={(e) => addSignature(i, e)}
              className="border"
              style={{ width: "100%", maxWidth: "800px" }}
              ref={(ref) =>
                ref && ref.getContext("2d")?.drawImage(canvas, 0, 0)
              }
            />
          </div>
        ))}
      </div>
      {canvases.length > 0 && (
        <button
          onClick={exportToPdf}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Завантажити підписаний PDF
        </button>
      )}
    </div>
  );
}
