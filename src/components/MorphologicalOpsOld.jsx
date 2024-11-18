import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 12x12 test matrisi defektlerle
const originalImage = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Yapılandırma elemanları
const structuringElements = {
  plus: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ],
  square: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]
};

// İşlem açıklamaları
const operationDescriptions = {
  erosion: "Aşındırma (Erosion) işlemi nesneleri küçültür ve ince detayları kaldırır: F Θ S",
  dilation: "Genişletme (Dilation) işlemi nesneleri genişletir ve boşlukları doldurur: F ⊕ S",
  opening: "Opening (Açma) işlemi = ((F Θ S) ⊕ S). Erosion ardından Dilation uygulanır. Closing işleminin tersidir. Küçük gürültüleri ve çıkıntıları kaldırır.",
  closing: "Closing (Kapama) işlemi = ((F ⊕ S) Θ S). Dilation ardından Erosion uygulanır. Opening işleminin tersidir. Küçük boşlukları ve aralıkları doldurur.",
  boundaryDilation: "Dilation tabanlı sınır tespiti: (F ⊕ S) - F. Genişletilmiş görüntüden orijinal görüntü çıkarılır.",
  boundaryErosion: "Erosion tabanlı sınır tespiti: β(A) = A – (A Θ B). Orijinal görüntüden Erosion sonucu çıkarılır. Bu yöntem kenar tespiti için yaygın olarak kullanılır."
};

const createMatrix = (size) => Array(size).fill().map(() => Array(size).fill(0));

const MorphologicalOps = () => {
  const [state, setState] = useState({
    operation: 'erosion',
    processedImage: createMatrix(12),
    intermediateImage: null,
    phase: 1,
    selectedPixel: null,
    matchingPixels: [],
    isPlaying: false,
    currentStep: 0,
    message: ''
  });

  const getOperationPhaseDescription = (operation, phase) => {
    const descriptions = {
      opening: {
        1: "1. Aşama: Erosion (F Θ S) - Aşındırma işlemi uygulanıyor...",
        2: "2. Aşama: Dilation ((F Θ S) ⊕ S) - Genişletme işlemi uygulanıyor..."
      },
      closing: {
        1: "1. Aşama: Dilation (F ⊕ S) - Genişletme işlemi uygulanıyor...",
        2: "2. Aşama: Erosion ((F ⊕ S) Θ S) - Aşındırma işlemi uygulanıyor..."
      },
      boundaryDilation: {
        1: "1. Aşama: Dilation (A ⊕ B) işlemi uygulanıyor...",
        2: "2. Aşama: Dış sınır hesaplanıyor: (A ⊕ B) - A"
      },
      boundaryErosion: {
        1: "1. Aşama: Erosion (A Θ B) işlemi uygulanıyor...",
        2: "2. Aşama: İç sınır hesaplanıyor: A - (A Θ B)"
      }
    };
    return descriptions[operation]?.[phase] || "";
  };

  const processFuncs = useMemo(() => ({
    erosion: (matches) => matches.length === 5,
    dilation: (matches) => matches.length > 0,
    boundaryDilation: (matches, phase, row, col) => {
      if (phase === 1) {
        // Dilation phase
        return matches.length > 0;
      } else {
        // Subtraction phase - dilated minus original
        return state.intermediateImage[row][col] === 1 && originalImage[row][col] === 0;
      }
    },
    boundaryErosion: (matches, phase, row, col) => {
      if (phase === 1) {
        // Erosion phase
        return matches.length === 5;
      } else {
        // Subtraction phase - original minus eroded
        return originalImage[row][col] === 1 && state.intermediateImage[row][col] === 0;
      }
    },
    opening: (matches, phase) => phase === 1 ? matches.length === 5 : matches.length > 0,
    closing: (matches, phase) => phase === 1 ? matches.length > 0 : matches.length === 5
  }), [state.intermediateImage]);

  const processPixel = (row, col) => {
    const checkImage = state.phase === 1 || !['opening', 'closing'].includes(state.operation) 
      ? originalImage 
      : state.intermediateImage;
    
    const matches = [];
    const se = structuringElements.plus;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (se[i+1][j+1] === 1) {
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < 12 && newCol >= 0 && newCol < 12 && 
              checkImage[newRow][newCol] === 1) {
            matches.push([newRow, newCol]);
          }
        }
      }
    }

    const processFunc = processFuncs[state.operation];
    const result = processFunc(matches, state.phase, row, col);

    setState(prev => {
      const newProcessed = [...prev.processedImage];
      newProcessed[row][col] = result ? 1 : 0;
      
      return {
        ...prev,
        processedImage: newProcessed,
        selectedPixel: [row, col],
        matchingPixels: matches,
        message: `${getOperationPhaseDescription(prev.operation, prev.phase)} İşleniyor: (${row},${col}) - Eşleşme: ${matches.length} piksel`
      };
    });
  };

  useEffect(() => {
    if (!state.isPlaying) return;

    const timeoutId = setTimeout(() => {
      if (state.currentStep < 144) {
        const row = Math.floor(state.currentStep / 12);
        const col = state.currentStep % 12;
        processPixel(row, col);
        setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      } else if ((['opening', 'closing', 'boundaryDilation', 'boundaryErosion'].includes(state.operation)) && state.phase === 1) {
        setState(prev => ({
          ...prev,
          intermediateImage: prev.processedImage,
          processedImage: createMatrix(12),
          currentStep: 0,
          phase: 2
        }));
      } else {
        setState(prev => ({
          ...prev,
          isPlaying: false,
          currentStep: 0,
          selectedPixel: null,
          matchingPixels: [],
          phase: 1
        }));
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [state.isPlaying, state.currentStep, state.phase, state.operation]);

  const Cell = ({ value, isSelected, isMatching, size = "w-4 h-4" }) => (
    <div className={`
      ${size} flex items-center justify-center transition-all duration-200
      ${value ? 'bg-blue-500' : 'bg-gray-100'}
      ${isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''}
      ${isMatching ? 'ring-2 ring-green-400' : ''}
    `} />
  );

  const Matrix = ({ data, highlight, title, isIntermediate }) => (
    <div className="text-center">
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="inline-grid gap-0.5 bg-white p-2 rounded shadow-sm">
        {data.map((row, i) => (
          <div key={i} className="flex gap-0.5">
            {row.map((cell, j) => (
              <Cell
                key={`${i}-${j}`}
                value={cell}
                isSelected={highlight?.selectedPixel?.[0] === i && highlight?.selectedPixel?.[1] === j}
                isMatching={highlight?.matchingPixels?.some(([r, c]) => r === i && c === j)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(operationDescriptions).map(op => (
            <button
              key={op}
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  operation: op,
                  processedImage: createMatrix(12),
                  intermediateImage: null,
                  phase: 1,
                  currentStep: 0,
                  isPlaying: false
                }));
              }}
              className={`px-3 py-1 rounded text-sm
                ${state.operation === op ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {op.charAt(0).toUpperCase() + op.slice(1)}
            </button>
          ))}
        </div>

        {state.message && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Matrix 
            data={originalImage} 
            highlight={state.isPlaying ? { selectedPixel: state.selectedPixel, matchingPixels: state.matchingPixels } : null}
            title="Orijinal"
          />
          
          {state.intermediateImage && (
            <Matrix
              data={state.intermediateImage}
              highlight={state.phase === 2 && state.isPlaying ? { selectedPixel: state.selectedPixel, matchingPixels: state.matchingPixels } : null}
              title="Ara Sonuç"
              isIntermediate={true}
            />
          )}
          
          <Matrix
            data={state.processedImage}
            highlight={state.isPlaying ? { selectedPixel: state.selectedPixel, matchingPixels: state.matchingPixels } : null}
            title={state.phase === 1 ? 'İşlenen' : 'Final'}
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded"
          >
            {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {state.isPlaying ? 'Duraklat' : 'Başlat'}
          </button>
          
          <button
            onClick={() => setState(prev => ({
              ...prev,
              processedImage: createMatrix(12),
              intermediateImage: null,
              phase: 1,
              currentStep: 0,
              isPlaying: false
            }))}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded"
          >
            <RotateCcw className="w-4 h-4" />
            Sıfırla
          </button>
        </div>

      {state.operation.startsWith('boundary') && (
        <div className="text-sm bg-blue-50 p-3 rounded-lg mt-2">
          <p className="font-semibold mb-1">Sınır Belirleme Formülleri:</p>
          <p className="mb-2">Matematiksel tanım: β(A) = A – (A Θ B)</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Erosion Tabanlı:</p>
              <p>1. A Θ B (Erosion)</p>
              <p>2. A – (A Θ B)</p>
            </div>
            <div>
              <p className="font-medium">Dilation Tabanlı:</p>
              <p>1. A ⊕ B (Dilation)</p>
              <p>2. (A ⊕ B) – A</p>
            </div>
          </div>
          
          <p className="mt-2 text-gray-600">
            {state.operation === 'boundaryErosion' 
              ? "Bu yöntem nesnenin iç sınırlarını tespit eder" 
              : "Bu yöntem nesnenin dış sınırlarını tespit eder"}
          </p>
        </div>
      )}
      {state.operation === 'opening' && (
        <div className="text-sm bg-blue-50 p-3 rounded-lg mt-2">
          <p className="font-semibold mb-1">Opening İşlemi Formülü:</p>
          <p>Opening = ((F Θ S) ⊕ S)</p>
          <p>1. Erosion (F Θ S)</p>
          <p>2. Dilation sonucu üzerine ((F Θ S) ⊕ S)</p>
          <p className="mt-1 text-gray-600">Not: Closing işleminin tersi olarak çalışır</p>
        </div>
      )}
      {state.operation === 'closing' && (
        <div className="text-sm bg-blue-50 p-3 rounded-lg mt-2">
          <p className="font-semibold mb-1">Closing İşlemi Formülü:</p>
          <p>Closing = ((F ⊕ S) Θ S)</p>
          <p>1. Dilation (F ⊕ S)</p>
          <p>2. Erosion sonucu üzerine ((F ⊕ S) Θ S)</p>
          <p className="mt-1 text-gray-600">Not: Opening işleminin tersi olarak çalışır</p>
        </div>
      )}
      <div className="text-sm text-gray-600 mt-2">
        {operationDescriptions[state.operation]}
      </div>
      </div>
    </div>
  );
};

export default MorphologicalOpsOld;