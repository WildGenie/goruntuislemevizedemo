import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, StepForward } from 'lucide-react';

const IMG = [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0,0],[0,1,1,1,1,0,1,1,1,1,0,0],[0,1,1,1,0,1,0,1,1,1,0,0],[0,1,0,1,1,1,1,1,0,1,0,0],[0,1,1,1,1,0,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0,0],[0,0,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]];
const SE = [[0,1,0],[1,1,1],[0,1,0]];

const descriptions = {
  erosion: 'Erosion: Yapı elemanının tüm pozisyonlarında (5 eşleşme) görüntü değeri 1 olmalı',
  dilation: 'Dilation: En az bir pozisyonda görüntü değeri 1 olmalı',
  inner: 'İç Sınır: Orijinal değer 1 VE erosion sonucu 0 ise piksel iç sınırdadır',
  outer: 'Dış Sınır: Dilation sonucu 1 VE orijinal değer 0 ise piksel dış sınırdadır' 
};

const BoundaryOps = () => {
  const [state, setState] = useState({
    op: 'inner',
    mat: Array(12).fill().map(() => Array(12).fill(0)), 
    phase: 1,
    pos: null,
    matches: [],
    play: false,
    step: 0
  });

  const next = () => {
    if (state.step >= 144) {
      if (state.phase === 1) {
        setState(prev => {
          const mat = Array(12).fill().map(() => Array(12).fill(0));
          
          for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 12; j++) {
              mat[i][j] = state.op === 'inner'
                ? IMG[i][j] === 1 && prev.mat[i][j] === 0 ? 1 : 0
                : prev.mat[i][j] === 1 && IMG[i][j] === 0 ? 1 : 0;
            }
          }
          
          return { 
            ...prev, 
            mat,
            phase: 2,
            step: 144, 
            play: false,
            pos: null,
            matches: [] 
          };
        });
        return;
      }
      setState(prev => ({ ...prev, play: false }));
      return;
    }
    
    const [r, c] = [Math.floor(state.step/12), state.step%12];
    
    const matches = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (SE[i+1][j+1] === 1 && IMG[r+i]?.[c+j] === 1) matches.push([r+i, c+j]);  
      }
    }

    const val = state.op === 'inner' ? matches.length === 5 : matches.length > 0;

    setState(prev => {
      const mat = [...prev.mat];  
      mat[r][c] = val ? 1 : 0;
      return { ...prev, mat, pos: [r,c], matches, step: prev.step + 1 };
    });
  };

  useEffect(() => {
    const timer = state.play && setTimeout(next, 200);
    return () => clearTimeout(timer);
  }, [state.play, state.step]);

  return (
    <div className="p-4">
      <div className="flex justify-center gap-4 mb-4">  
        {['inner', 'outer'].map(op => (
          <button key={op} onClick={() => setState({
            op,
            mat: Array(12).fill().map(() => Array(12).fill(0)),
            phase: 1, 
            pos: null,
            matches: [],
            play: false,
            step: 0
          })} className={`px-3 py-1 rounded text-sm ${state.op === op ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
            {op === 'inner' ? 'İç Sınır' : 'Dış Sınır'}  
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Matrix data={IMG} title="Orijinal" />
            <Matrix data={state.mat} pos={state.phase === 1 ? state.pos : null} title={state.phase === 1 ? `${state.op === 'inner' ? 'Erosion' : 'Dilation'} Sonucu` : 'Sınır'} sel={state.phase === 1} />
          </div>
          
          <Controls state={state} setState={setState} next={next} />
        </div>

        <Operation state={state} />
      </div>
    </div>
  );
};

const Matrix = ({ data, pos, title, sel }) => (
  <div className="text-center">
    <div className="text-sm font-medium mb-1">{title}</div>
    <div className="inline-grid gap-0.5 p-2 bg-white rounded shadow-sm">
      {data.map((row, i) => (
        <div key={i} className="flex gap-0.5">
          {row.map((val, j) => (
            <div key={j}
              className={`w-4 h-4 
                ${val ? 'bg-blue-500' : 'bg-gray-100'}
                ${sel && pos?.[0] === i && pos?.[1] === j ? 'ring-2 ring-yellow-400' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Operation = ({ state }) => {
  if (!state.pos || state.phase === 2) return null;
  
  const { op, pos, matches } = state;
  const window = Array(3).fill().map((_, i) => Array(3).fill().map((_, j) => IMG[pos[0]+i-1]?.[pos[1]+j-1] ?? 0));
  
  const condition = op === 'inner' ? matches.length === 5 : matches.length > 0;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-center text-sm font-medium mb-4">{op === 'inner' ? 'Erosion' : 'Dilation'}</h3>
      
      <div className="flex gap-4">
        <div className="grid grid-cols-3 gap-1">
          {window.map((row, i) => row.map((v, j) => (
            <div key={`${i}-${j}`}
            className={`w-8 h-8 flex items-center justify-center border  
              ${SE[i][j] ? 'bg-yellow-50' : 'bg-gray-50'}
              ${SE[i][j] && matches.some(([r,c]) => r === pos[0]+i-1 && c === pos[1]+j-1) ? 'ring-2 ring-green-400' : ''}  
              ${i === 1 && j === 1 ? 'ring-2 ring-blue-400' : ''}`}
            >{v}</div>
          )))}
        </div>
      
        <ArrowRight className="w-6 h-6 text-gray-400" />
        
        <div className={`w-10 h-10 flex items-center justify-center border ${condition ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
          {condition ? '1' : '0'}
        </div>
      </div>

      <div className="mt-4 text-sm space-y-2">  
        <div className="font-medium">İşlem Detayları:</div>
        <div>Merkez Piksel: ({pos[0]}, {pos[1]})</div>  
        <div>Yapı Elemanı Eşleşmeleri: {matches.length}</div>
        <div className="bg-blue-50 p-2 rounded">
          <div>{descriptions[op === 'inner' ? 'erosion' : 'dilation']}</div>
          <div className={`mt-2 ${condition ? 'text-green-600' : 'text-red-600'}`}>
            → {condition ? `${matches.length} eşleşme var, ${op === 'inner' ? 'erosion için yeterli' : 'dilation için yeterli'}` : `${matches.length} eşleşme var, ${op === 'inner' ? '5 gerekli' : 'en az 1 gerekli'}`}
          </div>
        </div>

        {state.phase === 1 && (
          <div className="bg-green-50 p-2 rounded">
            <div>{descriptions[op]}</div>
          </div>
        )}
      </div>
    </div>
  );  
};

const Controls = ({ state, setState, next }) => (
  <div className="flex justify-center gap-4">
    <button onClick={() => setState(prev => ({...prev, play: !prev.play}))}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded">  
      {state.play ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {state.play ? 'Duraklat' : 'Başlat'}
    </button>
            
    <button onClick={next} disabled={state.play || state.step >= 144}  
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
      <StepForward className="w-4 h-4" /> 
      {state.phase === 1 ? 'Adım' : 'Bitir'}
    </button>
            
    <button onClick={() => setState({
      op: state.op,  
      mat: Array(12).fill().map(() => Array(12).fill(0)),
      phase: 1,
      pos: null, 
      matches: [],
      play: false,
      step: 0
    })} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded">
      <RotateCcw className="w-4 h-4" />
      Sıfırla  
    </button>
  </div>
);

export default BoundaryOps;