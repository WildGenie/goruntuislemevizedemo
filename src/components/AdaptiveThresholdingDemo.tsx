import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const originalImage = [
  [67, 71, 72, 110, 87, 86, 90, 75],
  [52, 79, 78, 89, 88, 85, 92, 71],
  [92, 42, 97, 95, 79, 86, 85, 69],
  [62, 68, 96, 120, 89, 78, 84, 84],
  [64, 72, 82, 84, 82, 81, 42, 42],
  [75, 65, 55, 85, 87, 47, 45, 55],
  [74, 76, 48, 34, 38, 46, 49, 50],
  [75, 77, 75, 72, 45, 52, 64, 65]
];

const createPaddedImage = () => {
  const padded = [];
  padded.push([...originalImage[0]]);
  originalImage.forEach(row => padded.push([...row]));
  padded.push([...originalImage[originalImage.length-1]]);
  padded.forEach(row => {
    row.unshift(row[0]);
    row.push(row[row.length-1]);
  });
  return padded;
};

const AdaptiveThresholdingDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [focusWindow, setFocusWindow] = useState(null);
  const [resultMatrix, setResultMatrix] = useState(Array(8).fill().map(() => Array(8).fill(null)));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAverage, setCurrentAverage] = useState(null);
  const paddedImage = createPaddedImage();

  const steps = [];
  for(let i = 1; i <= originalImage.length; i++) {
    for(let j = 1; j <= originalImage[0].length; j++) {
      steps.push({ row: i, col: j });
    }
  }

  const resetDemo = () => {
    setCurrentStep(0);
    setSelectedCell(null);
    setFocusWindow(null);
    setResultMatrix(Array(8).fill().map(() => Array(8).fill(null)));
    setIsPlaying(false);
    setCurrentAverage(null);
  };

  const calculateValue = (row, col) => {
    const window = Array(3).fill().map((_, i) => 
      Array(3).fill().map((_, j) => paddedImage[row-1+i][col-1+j])
    );
    const values = window.flat();
    const average = Math.round(values.reduce((a, b) => a + b, 0) / 9);
    return {
      window,
      values,
      average,
      result: paddedImage[row][col] >= average ? 1 : 0
    };
  };

  const nextStep = async () => {
    if (currentStep < steps.length) {
      const { row, col } = steps[currentStep];
      const { window, values, average, result } = calculateValue(row, col);

      setSelectedCell({ row: row-1, col: col-1 });
      setFocusWindow({
        values: window,
        average,
        centerValue: paddedImage[row][col],
        result
      });
      setCurrentAverage(average);

      await new Promise(resolve => setTimeout(resolve, 300));

      const newMatrix = [...resultMatrix];
      newMatrix[row-1][col-1] = result;
      setResultMatrix(newMatrix);

      setCurrentStep(prev => prev + 1);

      if (currentStep + 1 >= steps.length) {
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    let isActive = true;
    
    const runStep = async () => {
      if (!isActive || !isPlaying || currentStep >= steps.length) return;
      await nextStep();
      if (isActive && isPlaying && currentStep < steps.length) {
        setTimeout(runStep, 800);
      }
    };

    if (isPlaying) {
      runStep();
    }

    return () => {
      isActive = false;
    };
  }, [isPlaying, currentStep]);

  const isInCurrentWindow = (row, col) => {
    if (!selectedCell) return false;
    const windowRow = selectedCell.row + 1;
    const windowCol = selectedCell.col + 1;
    return row >= windowRow-1 && row <= windowRow+1 && 
           col >= windowCol-1 && col <= windowCol+1;
  };

  const renderCell = (value, row, col, isPadded = false, isResult = false) => {
    const isSelected = !isPadded && selectedCell?.row === row && selectedCell?.col === col;
    const isInWindow = isInCurrentWindow(row+1, col+1);

    return (
      <div 
        key={`${row}-${col}`}
        className={`relative w-12 h-12 ${isInWindow ? '-translate-y-1' : ''} transition-all duration-300`}
        style={{ zIndex: isInWindow ? 20 : 'auto' }}
      >
        <div className={`w-full h-full flex items-center justify-center border
          ${isPadded ? 'bg-gray-200 border-gray-400' : 
            isResult ? (value === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100') :
            isSelected ? 'bg-yellow-200 border-yellow-500' : 
            'bg-white border-gray-300'}
          ${isInWindow ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
          transition-all duration-300`}
        >
          {isResult ? (value === null ? '' : value) : value}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-8">
        <div className="border-r pr-4 flex items-center space-x-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            disabled={currentStep >= steps.length}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Duraklat' : 'Başlat'}
          </button>

          <button 
            onClick={() => !isPlaying && nextStep()}
            disabled={currentStep >= steps.length || isPlaying}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Adım
          </button>
        </div>

        <button 
          onClick={resetDemo}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Sıfırla
        </button>

        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          Adım: {currentStep}/{steps.length}
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        <div>
          <h3 className="font-semibold mb-2">Orijinal Görüntü (Padding İle)</h3>
          <div className="grid grid-flow-row gap-0">
            {paddedImage.map((row, i) => (
              <div key={i} className="flex">
                {row.map((cell, j) => renderCell(cell, i-1, j-1, i === 0 || i === paddedImage.length-1 || j === 0 || j === row.length-1))}
              </div>
            ))}
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${focusWindow ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="font-semibold mb-2">3x3 Pencere ve İşlem</h3>
          {focusWindow && (
            <div className="space-y-4">
              <div className="grid grid-flow-row gap-0">
                {focusWindow.values.map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((cell, j) => {
                      const isCenter = i === 1 && j === 1;
                      return (
                        <div 
                          key={`${i}-${j}`}
                          className={`w-12 h-12 flex items-center justify-center border
                            ${isCenter ? 'bg-yellow-100 border-yellow-500 font-bold' : 
                            'bg-blue-50 border-blue-200'}`}
                        >
                          {cell}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Merkez Değer</div>
                  <div className={`w-24 h-24 flex items-center justify-center text-2xl font-bold rounded-lg
                    ${focusWindow.centerValue >= focusWindow.average ? 
                      'bg-green-100 border-2 border-green-500 text-green-700' : 
                      'bg-red-100 border-2 border-red-500 text-red-700'}`}>
                    {focusWindow.centerValue}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-2xl font-bold px-4">
                    {focusWindow.centerValue >= focusWindow.average ? '≥' : '<'}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Pencere Ortalaması</div>
                  <div className="w-24 h-24 flex items-center justify-center bg-blue-100 border-2 border-blue-500 text-2xl font-bold rounded-lg text-blue-700">
                    {focusWindow.average}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-lg">Sonuç:</div>
                <div className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-lg
                  ${focusWindow.result ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {focusWindow.result}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-2">Sonuç Görüntü</h3>
        <div className="grid grid-flow-row gap-0">
          {resultMatrix.map((row, i) => (
            <div key={i} className="flex">
              {row.map((cell, j) => renderCell(cell, i, j, false, true))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveThresholdingDemo;
