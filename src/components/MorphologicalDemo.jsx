import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';

// Orijinal görüntü ve yapılandırma elemanı aynı...
const originalImage = [
  [67, 71, 72, 110, 87, 86],
  [52, 79, 78, 89, 88, 85],
  [92, 42, 97, 95, 79, 86],
  [62, 68, 96, 120, 89, 78],
  [64, 72, 82, 84, 82, 81]
];

const structuringElement = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 1]
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

const MorphologicalDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [operation, setOperation] = useState("erosion");
  const [selectedCell, setSelectedCell] = useState(null);
  const [focusWindow, setFocusWindow] = useState(null);
  const [resultMatrix, setResultMatrix] = useState(Array(5).fill().map(() => Array(6).fill(null)));
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedValues, setHighlightedValues] = useState([]);
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
    setResultMatrix(Array(5).fill().map(() => Array(6).fill(null)));
    setIsPlaying(false);
    setHighlightedValues([]);
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
  }, [isPlaying, currentStep, steps.length]);

  const calculateValue = (row, col) => {
    const values = [];
    for(let i = 0; i < 3; i++) {
      for(let j = 0; j < 3; j++) {
        if(structuringElement[i][j] === 1) {
          values.push(paddedImage[row-1+i][col-1+j]);
        }
      }
    }
    return operation === "erosion" ? Math.min(...values) : Math.max(...values);
  };

  // animateValueSearch fonksiyonunu kaldırdık, mantık nextStep içinde yeniden düzenlendi

  const nextStep = async () => {
    if (currentStep < steps.length) {
      setHighlightedValues([]); // Reset highlights
      
      const { row, col } = steps[currentStep];
      const window = Array(3).fill().map((_, i) => 
        Array(3).fill().map((_, j) => paddedImage[row-1+i][col-1+j])
      );

      // Set selected cell and window first
      setSelectedCell({ row: row-1, col: col-1 });
      const relevantValues = [];
      for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
          if(structuringElement[i][j] === 1) {
            relevantValues.push(window[i][j]);
          }
        }
      }

      const result = operation === "erosion" ? Math.min(...relevantValues) : Math.max(...relevantValues);
      
      setFocusWindow({
        values: window,
        relevantValues,
        result
      });

      // Wait for window animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Highlight only the min/max value
      const targetValue = operation === "erosion" ? Math.min(...relevantValues) : Math.max(...relevantValues);
      setHighlightedValues([targetValue]);
      
      await new Promise(resolve => setTimeout(resolve, 600));

      // Update result matrix
      const newMatrix = [...resultMatrix];
      newMatrix[row-1][col-1] = result;
      setResultMatrix(newMatrix);
      
      // Move to next step
      setCurrentStep(prev => prev + 1);
      
      if (currentStep + 1 >= steps.length) {
        setIsPlaying(false);
      }
    }
  };

  const isInCurrentWindow = (row, col) => {
    if (!selectedCell) return false;
    const windowRow = selectedCell.row + 1;
    const windowCol = selectedCell.col + 1;
    return row >= windowRow-1 && row <= windowRow+1 && 
           col >= windowCol-1 && col <= windowCol+1;
  };

  const getCellColor = (value, isStructElement = false) => {
    if (isStructElement) return value === 1 ? 'bg-purple-100 border-purple-500' : 'bg-gray-50 border-gray-300';
    if (value === null) return 'bg-gray-50 border-gray-300';
    const intensity = Math.floor((value / 150) * 255);
    return `bg-[rgb(${255-intensity},${255-intensity},255)] border-blue-300`;
  };

  const renderCell = (value, row, col, isPadded = false) => {
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
            isSelected ? 'bg-blue-200 border-blue-500' : 
            getCellColor(value)}
          ${isInWindow ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
          transition-all duration-300`}
          style={{
            boxShadow: isInWindow ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none'
          }}
        >
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-4">
        <div className="border-r pr-4">
          <Button 
            onClick={() => {
              setOperation("erosion");
              resetDemo();
            }}
            variant={operation === "erosion" ? "default" : "outline"}
            className="mr-2"
          >
            Erosion
          </Button>
          <Button 
            onClick={() => {
              setOperation("dilation");
              resetDemo();
            }}
            variant={operation === "dilation" ? "default" : "outline"}
          >
            Dilation
          </Button>
        </div>
        
        <div className="border-r pr-4 flex items-center space-x-2">
          <Button onClick={() => setIsPlaying(!isPlaying)} disabled={currentStep >= steps.length}
            variant="outline" className="min-w-[100px]"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button onClick={() => !isPlaying && nextStep()} 
            disabled={currentStep >= steps.length || isPlaying}
            variant="outline"
          >
            Step
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={resetDemo} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <div className="bg-gray-100 px-4 py-2 rounded-md">
            Step: {currentStep}/{steps.length}
          </div>
        </div>
      </div>

      <div className="flex space-x-8">
        <div>
          <h3 className="font-semibold mb-2">Padded Görüntü</h3>
          <div className="grid grid-flow-row gap-0">
            {paddedImage.map((row, i) => (
              <div key={i} className="flex">
                {row.map((cell, j) => renderCell(cell, i-1, j-1, i === 0 || i === paddedImage.length-1 || j === 0 || j === row.length-1))}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Yapılandırma Elemanı</h3>
          <div className="grid grid-flow-row gap-0">
            {structuringElement.map((row, i) => (
              <div key={i} className="flex">
                {row.map((cell, j) => (
                  <div 
                    key={`${i}-${j}`}
                    className={`w-12 h-12 flex items-center justify-center border ${getCellColor(cell, true)}`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-8">
        <div>
          <h3 className="font-semibold mb-2">Sonuç Görüntü</h3>
          <div className="grid grid-flow-row gap-0">
            {resultMatrix.map((row, i) => (
              <div key={i} className="flex">
                {row.map((cell, j) => renderCell(cell, i, j))}
              </div>
            ))}
          </div>
        </div>
        
        <div className={`transition-opacity duration-300 ${focusWindow ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="font-semibold mb-2">3x3 Pencere ve İşlem</h3>
          {focusWindow && (
            <div>
              <div className="grid grid-flow-row gap-0 mb-4">
                {focusWindow.values.map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((cell, j) => {
                      const isRelevant = structuringElement[i][j] === 1;
                      const isTargetValue = isRelevant && highlightedValues.includes(cell);
                      return (
                        <div 
                          key={`${i}-${j}`}
                          className={`relative w-12 h-12 ${isRelevant ? '-translate-y-1' : ''} transition-all duration-300`}
                          style={{ zIndex: isRelevant ? 20 : 'auto' }}
                        >
                          <div className={`w-full h-full flex items-center justify-center border
                            ${isRelevant ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-300'}
                            ${isTargetValue ? 'ring-4 ring-green-400 ring-opacity-50 bg-green-100 border-green-500 font-bold text-lg scale-110' : ''}
                            transition-all duration-300`}
                            style={{
                              boxShadow: isTargetValue ? '0 0 15px rgba(74, 222, 128, 0.5)' : 
                                        isRelevant ? '0 0 5px rgba(234, 179, 8, 0.2)' : 'none'
                            }}
                          >
                            {cell}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 mx-4" />
                <div className="w-12 h-12 flex items-center justify-center border border-green-500 bg-green-100 font-bold text-lg">
                  {focusWindow.result}
                </div>
                <div className="ml-4">
                  {operation === "erosion" ? "Minimum" : "Maximum"} değer
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MorphologicalDemo;