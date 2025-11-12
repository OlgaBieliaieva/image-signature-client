import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import "../App.css";

export default function SignaturePadComp({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const sigRef = useRef<SignaturePad | null>(null);

  const save = () => {
    const data = sigRef.current?.toDataURL("image/png") ?? null;
    onChange(data);
  };

  const clear = () => {
    sigRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="signature-pad">
      <SignaturePad
        ref={(c) => (sigRef.current = c)}
        canvasProps={{ width: 300, height: 120 }}
      />
      <div className="buttons">
        <button type="button" onClick={save} className="save-btn">
          Зберегти
        </button>
        <button type="button" onClick={clear} className="clear-btn">
          Очистити
        </button>
      </div>
    </div>
  );
}
