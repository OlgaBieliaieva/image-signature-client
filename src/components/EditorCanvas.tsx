import React, { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
} from "react-konva";
import "../App.css";

interface Props {
  imageFile: File;
  text: string;
  signatureDrawn?: string | null;
  signatureFile?: File | null;
  onExport: (blob: Blob) => void;
}

export default function EditorCanvas({
  imageFile,
  text,
  signatureDrawn,
  signatureFile,
  onExport,
}: Props) {
  const stageRef = useRef<any>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [sigImage, setSigImage] = useState<HTMLImageElement | null>(null);
  const [textPos, setTextPos] = useState({ x: 100, y: 100 });
  const [sigPos, setSigPos] = useState({ x: 300, y: 300 });
  const [sigScale, setSigScale] = useState(1);
  const [textScale, setTextScale] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [imageFile]);

  useEffect(() => {
    if (signatureDrawn) {
      const img = new Image();
      img.onload = () => setSigImage(img);
      img.src = signatureDrawn;
    } else if (signatureFile) {
      const url = URL.createObjectURL(signatureFile);
      const img = new Image();
      img.onload = () => {
        setSigImage(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else setSigImage(null);
  }, [signatureDrawn, signatureFile]);

  const handleExport = () => {
    if (!stageRef.current || !bgImage) return;

    const oldScale = stageRef.current.scaleX();
    const oldPos = stageRef.current.position();

    stageRef.current.scale({ x: 1, y: 1 });
    stageRef.current.position({ x: 0, y: 0 });
    stageRef.current.batchDraw();

    const dataUrl = stageRef.current.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
      x: 0,
      y: 0,
      width: bgImage.width,
      height: bgImage.height,
    });

    stageRef.current.scale({ x: oldScale, y: oldScale });
    stageRef.current.position(oldPos);
    stageRef.current.batchDraw();

    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => onExport(blob));
  };

  const handleStageWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.3, Math.min(newScale, 4));
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
    stage.batchDraw();
    setStageScale(clampedScale);
  };

  const resetPositions = () => {
    setTextPos({ x: 100, y: 100 });
    setSigPos({ x: 300, y: 300 });
    setSigScale(1);
    setTextScale(1);
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  return (
    <div className="editor-canvas">
      <div className="stage-container">
        <Stage
          ref={stageRef}
          width={900}
          height={700}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable
          onWheel={handleStageWheel}
        >
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={0}
                y={0}
                width={bgImage.width}
                height={bgImage.height}
              />
            )}

            {text && (
              <KonvaText
                text={text}
                x={textPos.x}
                y={textPos.y}
                fontSize={24 * textScale}
                fill="#1e293b"
                draggable
                onDragEnd={(e) =>
                  setTextPos({ x: e.target.x(), y: e.target.y() })
                }
                onWheel={(e) => {
                  e.evt.preventDefault();
                  const newScale =
                    e.evt.deltaY < 0 ? textScale * 1.1 : textScale / 1.1;
                  setTextScale(Math.max(0.1, Math.min(newScale, 5)));
                }}
              />
            )}

            {sigImage && (
              <KonvaImage
                image={sigImage}
                x={sigPos.x}
                y={sigPos.y}
                scaleX={sigScale}
                scaleY={sigScale}
                draggable
                onDragEnd={(e) =>
                  setSigPos({ x: e.target.x(), y: e.target.y() })
                }
                onWheel={(e) => {
                  e.evt.preventDefault();
                  const newScale =
                    e.evt.deltaY < 0 ? sigScale * 1.1 : sigScale / 1.1;
                  setSigScale(Math.max(0.1, Math.min(newScale, 5)));
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      <div className="editor-controls">
        <div className="buttons">
          <button onClick={handleExport} className="save-btn">
            💾 Зберегти у PDF
          </button>
          <button onClick={resetPositions} className="reset-btn">
            🔄 Скинути
          </button>
        </div>
        <span>Zoom: {(stageScale * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
