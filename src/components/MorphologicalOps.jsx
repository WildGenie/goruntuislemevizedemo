import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, StepForward } from 'lucide-react';

const IMG = [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0,0],[0,1,1,1,1,0,1,1,1,1,0,0],[0,1,1,1,0,1,0,1,1,1,0,0],[0,1,0,1,1,1,1,1,0,1,0,0],[0,1,1,1,1,0,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0,0],[0,0,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]];
const SE = [[0,1,0],[1,1,1],[0,1,0]];
const newMat = () => Array(12).fill().map(() => Array(12).fill(0));

const descriptions = {
  erosion: '• Yapı elemanının tüm pozisyonlarında (5 eşleşme) görüntü değeri 1 olmalı\n• Bu pikselin sonucu 1 olması için yapı elemanının tüm 1 değerli pozisyonlarında görüntüde de 1 olmalıdır',
  dilation: '• Yapı elemanının en az bir pozisyonunda görüntü değeri 1 olmalı\n• Bu pikselin sonucu 1 olması için yapı elemanının 1 değerli pozisyonlarından en az birinde görüntüde 1 olması yeterlidir',
  opening: {
    1: 'Erosion işlemi: Yapı elemanının tüm pozisyonlarında (5 eşleşme) görüntü değeri 1 olmalı',
    2: 'Dilation işlemi: Erosion sonucunda en az bir pozisyonda değer 1 olmalı'
  },
  closing: {
    1: 'Dilation işlemi: En az bir pozisyonda görüntü değeri 1 olmalı',
    2: 'Erosion işlemi: Dilation sonucunda tüm pozisyonlarda (5 eşleşme) değer 1 olmalı'
  },
  boundaryErosion: {
    1: 'İlk Adım: Erosion (A Θ B) işlemi uygulanıyor\n' +
       'Yapı elemanının tüm pozisyonlarında (5) görüntü değeri 1 olmalı',
    2: 'İç Sınır Hesaplama: A - (A Θ B)\n' +
       '• İlk görüntüden (A) erosion sonucu çıkarılıyor\n' +
       '• Orijinal değer 1 VE erosion sonucu 0 ise piksel sınırdadır (sonuç 1)\n' +
       '• Diğer durumlar sınır değildir (sonuç 0)'
  },
  boundaryDilation: {
    1: 'İlk Adım: Dilation (A ⊕ B) işlemi uygulanıyor\n' + 
       'Yapı elemanının en az bir pozisyonunda görüntü değeri 1 olmalı',
    2: 'Dış Sınır Hesaplama: (A ⊕ B) - A\n' + 
       '• Dilation sonucundan ilk görüntü çıkarılıyor\n' +
       '• Dilation sonucu 1 VE orijinal değer 0 ise piksel sınırdadır (sonuç 1)\n' +
       '• Diğer durumlar sınır değildir (sonuç 0)'
  }
};

const Op = ({p, m, op, phase, check}) => {
  if (!p) return null;

  const w = Array(3).fill().map((_, i) => Array(3).fill().map((_, j) => {
    const [r,c] = [p[0]+i-1, p[1]+j-1];
    return r >= 0 && r < 12 && c >= 0 && c < 12 ? check[r][c] : 0;
  }));
  
  const isMatch = (i,j) => m.some(([r,c]) => r === p[0]+i-1 && c === p[1]+j-1);
  const res = ['boundaryErosion', 'boundaryDilation'].includes(op) && phase === 2 ?
    (op === 'boundaryErosion' ? IMG[p[0]][p[1]] === 1 && check[p[0]][p[1]] === 0 :
     check[p[0]][p[1]] === 1 && IMG[p[0]][p[1]] === 0) :
    {
      erosion: m.length === 5,
      dilation: m.length > 0,
      opening: phase === 1 ? m.length === 5 : m.length > 0,
      closing: phase === 1 ? m.length > 0 : m.length === 5,
      boundaryErosion: m.length === 5,
      boundaryDilation: m.length > 0
    }[op];

  const desc = descriptions[op]?.[phase] || descriptions[op];

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-center text-sm font-medium mb-4">{`${op.toUpperCase()} - Phase ${phase}`}</h3>
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-1">
          {w.map((row, i) => row.map((v, j) => (
            <div key={`${i}-${j}`} className={`w-8 h-8 flex items-center justify-center border
              ${SE[i][j] ? 'bg-yellow-50 -translate-y-0.5' : 'bg-gray-50'}
              ${SE[i][j] && isMatch(i,j) ? 'ring-2 ring-green-400 scale-110 bg-green-100' : ''}
              ${i === 1 && j === 1 ? 'ring-2 ring-blue-400' : ''}
              transition-all duration-300`}
            >{v}</div>
          )))}
        </div>
        <ArrowRight className="w-6 h-6 mx-4 text-gray-400" />
        <div className={`w-10 h-10 flex items-center justify-center border ${res ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
          {res ? '1' : '0'}
        </div>
      </div>
      <div className="mt-4 text-sm space-y-2">
        <div className="font-medium">İşlem Detayları:</div>
        <div>Merkez Piksel: ({p[0]}, {p[1]})</div>
        <div>Yapı Elemanı Eşleşmeleri: {m.length}</div>
        {(['boundaryErosion', 'boundaryDilation'].includes(op) && phase === 2) ? (
          <div className="bg-blue-50 p-2 rounded space-y-1">
            <div className="font-medium">Sınır Belirleme Hesaplaması:</div>
            {op === 'boundaryErosion' ? (
              <>
                <div>• Orijinal Değer (A): {IMG[p[0]][p[1]]}</div>
                <div>• Erosion Sonucu (A Θ B): {check[p[0]][p[1]]}</div>
                <div>• Çıkarma İşlemi (A - (A Θ B)):</div>
                <div className="pl-4">
                  {IMG[p[0]][p[1]]} - {check[p[0]][p[1]]} = {IMG[p[0]][p[1]] === 1 && check[p[0]][p[1]] === 0 ? '1' : '0'}
                </div>
                <div className={`mt-2 ${IMG[p[0]][p[1]] === 1 && check[p[0]][p[1]] === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {IMG[p[0]][p[1]] === 1 && check[p[0]][p[1]] === 0 ? 
                    '→ Piksel iç sınırdadır' : 
                    '→ Piksel iç sınırda değildir'}
                </div>
              </>
            ) : (
              <>
                <div>• Dilation Sonucu (A ⊕ B): {check[p[0]][p[1]]}</div>
                <div>• Orijinal Değer (A): {IMG[p[0]][p[1]]}</div>
                <div>• Çıkarma İşlemi ((A ⊕ B) - A):</div>
                <div className="pl-4">
                  {check[p[0]][p[1]]} - {IMG[p[0]][p[1]]} = {check[p[0]][p[1]] === 1 && IMG[p[0]][p[1]] === 0 ? '1' : '0'}
                </div>
                <div className={`mt-2 ${check[p[0]][p[1]] === 1 && IMG[p[0]][p[1]] === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {check[p[0]][p[1]] === 1 && IMG[p[0]][p[1]] === 0 ? 
                    '→ Piksel dış sınırdadır' : 
                    '→ Piksel dış sınırda değildir'}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 p-2 rounded">
            <div className="whitespace-pre-line">{desc}</div>
            {(op === 'erosion' || op === 'opening' && phase === 1) ? (
              <div className={`mt-2 ${m.length === 5 ? 'text-green-600' : 'text-red-600'}`}>
                → {m.length === 5 ? 'Tüm yapı elemanı pozisyonları eşleşti' : `${m.length} pozisyon eşleşti, 5 gerekli`}
              </div>
            ) : (
              <div className={`mt-2 ${m.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                → {m.length > 0 ? `${m.length} pozisyon eşleşti, yeterli` : 'Hiç eşleşme yok, en az 1 gerekli'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Mat = ({d, s, m, t}) => (
  <div className="text-center">
    <div className="text-sm font-medium mb-1">{t}</div>
    <div className="inline-grid gap-0.5 p-2 bg-white rounded shadow-sm">
      {d.map((r, i) => (
        <div key={i} className="flex gap-0.5">
          {r.map((c, j) => (
            <div key={j} className={`w-4 h-4 transition-all duration-200
              ${c ? 'bg-blue-500' : 'bg-gray-100'}
              ${s?.[0] === i && s?.[1] === j ? 'ring-2 ring-yellow-400 scale-110' : ''}
              ${m?.some(([r,c]) => r === i && c === j) ? 'ring-2 ring-green-400' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const MorphologicalOps = () => {
  const [s, setS] = useState({
    op: 'erosion',
    mat: newMat(),
    mid: null,
    phase: 1,
    p: null,
    m: [],
    play: false,
    step: 0
  });

  const next = () => {
    if (s.step >= 144) {
      if (['opening', 'closing', 'boundaryErosion', 'boundaryDilation'].includes(s.op) && s.phase === 1) {
        setS(p => ({
          ...p, 
          mid: p.mat,
          mat: newMat(),
          step: 0,
          phase: 2,
          play: false,
          p: null,
          m: []
        }));
        return;
      }
      setS(p => ({ ...p, play: false }));
      return;
    }

    const [r, c] = [Math.floor(s.step/12), s.step%12];
    const check = s.phase === 1 || !['opening', 'closing'].includes(s.op) ? IMG : s.mid;
    
    const m = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (SE[i+1][j+1] === 1) {
          const [nr, nc] = [r+i, c+j];
          if (nr >= 0 && nr < 12 && nc >= 0 && nc < 12 && check[nr][nc] === 1) {
            m.push([nr, nc]);
          }
        }
      }
    }

    let val = false;
    if (['boundaryErosion', 'boundaryDilation'].includes(s.op) && s.phase === 2) {
      val = s.op === 'boundaryErosion' ? 
        (IMG[r][c] === 1 && s.mid[r][c] === 0) :
        (s.mid[r][c] === 1 && IMG[r][c] === 0);
    } else {
      val = {
        erosion: m.length === 5,
        dilation: m.length > 0,
        opening: s.phase === 1 ? m.length === 5 : m.length > 0,
        closing: s.phase === 1 ? m.length > 0 : m.length === 5,
        boundaryErosion: m.length === 5,
        boundaryDilation: m.length > 0
      }[s.op];
    }

    setS(p => {
      const newMat = [...p.mat];
      newMat[r][c] = val ? 1 : 0;
      return { ...p, mat: newMat, p: [r,c], m, step: p.step + 1 };
    });
  };

  useEffect(() => {
    const t = s.play && setTimeout(next, 200);
    return () => clearTimeout(t);
  }, [s.play, s.step]);

  const ops = ['erosion', 'dilation', 'opening', 'closing', 'boundaryErosion', 'boundaryDilation'];

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {ops.map(op => (
          <button key={op} onClick={() => setS({
            op, mat: newMat(), mid: null, phase: 1, p: null, m: [], play: false, step: 0
          })} className={`px-3 py-1 rounded text-sm ${s.op === op ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
            {op.charAt(0).toUpperCase() + op.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Mat d={IMG} s={s.phase === 1 ? s.p : null} m={s.phase === 1 ? s.m : null} t="Original" />
            {s.mid && <Mat d={s.mid} s={s.phase === 2 ? s.p : null} m={s.phase === 2 ? s.m : null} t="Intermediate" />}
            <Mat d={s.mat} s={s.p} m={s.m} t={s.phase === 1 ? "Processing" : "Final"} />
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => setS(p => ({...p, play: !p.play}))}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded">
              {s.play ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {s.play ? 'Pause' : 'Play'}
            </button>
            
            <button onClick={next} disabled={s.play || s.step >= 144}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
              <StepForward className="w-4 h-4" />
              Step
            </button>
            
            <button onClick={() => setS(p => ({
              op: p.op, mat: newMat(), mid: null, phase: 1, p: null, m: [], play: false, step: 0
            }))} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div>
          {s.p && <Op p={s.p} m={s.m} op={s.op} phase={s.phase} 
            check={s.phase === 1 || !['opening', 'closing'].includes(s.op) ? IMG : s.mid} />}
        </div>
      </div>
    </div>
  );
};

export default MorphologicalOps;