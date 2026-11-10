import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Veriler
const rawData = [
  { department: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 92, totalStudents: 2443, totalGraduates: 115 },
  { department: 'Biyomühendislik', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 53, totalStudents: 1439, totalGraduates: 67 },
  { department: 'Çevre Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 41, totalStudents: 1465, totalGraduates: 177 },
  { department: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 110, totalStudents: 3478, totalGraduates: 270 },
  { department: 'Endüstri Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 68, totalStudents: 1598, totalGraduates: 73 },
  { department: 'Gıda Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 55, totalStudents: 2577, totalGraduates: 281 },
  { department: 'İnşaat Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 75, totalStudents: 3078, totalGraduates: 295 },
  { department: 'Kimya', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 52, totalStudents: 1725, totalGraduates: 87 },
  { department: 'Kimya Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 103, totalStudents: 2939, totalGraduates: 253 },
  { department: 'Matematik', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 10, totalStudents: 1579, totalGraduates: 69 },
  { department: 'Makine Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 158, totalStudents: 4098, totalGraduates: 323 },
  { department: 'Mekatronik Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 144, totalStudents: 3491, totalGraduates: 251 },
  { department: 'Metalurji ve Malzeme Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 82, totalStudents: 3243, totalGraduates: 231 },
  { department: 'Polimer Malzeme Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 38, totalStudents: 454, totalGraduates: 0 },
  { department: 'Fizik', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi', graduatedStudents: 0, totalStudents: 232, totalGraduates: 0 },
  { department: 'Orman Mühendisliği', faculty: 'Orman Fakültesi', graduatedStudents: 67, totalStudents: 1967, totalGraduates: 210 },
  { department: 'Peyzaj Mimarlığı', faculty: 'Orman Fakültesi', graduatedStudents: 21, totalStudents: 928, totalGraduates: 30 },
  { department: 'İşletme', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', graduatedStudents: 49, totalStudents: 1501, totalGraduates: 50 },
  { department: 'Psikoloji', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', graduatedStudents: 49, totalStudents: 2102, totalGraduates: 195 },
  { department: 'Sosyoloji', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', graduatedStudents: 12, totalStudents: 1824, totalGraduates: 182 },
  { department: 'Uluslararası İlişkiler', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', graduatedStudents: 25, totalStudents: 2017, totalGraduates: 131 },
  { department: 'Uluslararası Ticaret ve Lojistik', faculty: 'İnsan ve Toplum Bilimleri Fakültesi', graduatedStudents: 113, totalStudents: 2596, totalGraduates: 228 },
  { department: 'Mimarlık', faculty: 'Mimarlık ve Tasarım Fakültesi', graduatedStudents: 49, totalStudents: 2286, totalGraduates: 100 },
  { department: 'Şehir ve Bölge Planlama', faculty: 'Mimarlık ve Tasarım Fakültesi', graduatedStudents: 48, totalStudents: 2312, totalGraduates: 160 },
  { department: 'Lisansüstü', faculty: 'Lisansüstü', graduatedStudents: 234, totalStudents: 14407, totalGraduates: 1702 }
];

function UniversityDepartmentsVisualization() {
  const [selectedFaculty, setSelectedFaculty] = useState('Mühendislik ve Doğa Bilimleri Fakültesi');
  const [dataType, setDataType] = useState('reachedGraduateRatio');

  // Fakülteleri alma
  const faculties = Array.from(new Set(rawData.map(item => item.faculty)).values());

  // Toplamları hesaplama
  const overallTotals = useMemo(() => {
    return rawData.reduce((acc, curr) => {
      return {
        totalStudents: acc.totalStudents + curr.totalStudents,
        graduatedStudents: acc.graduatedStudents + curr.graduatedStudents,
        totalGraduates: acc.totalGraduates + curr.totalGraduates
      };
    }, { totalStudents: 0, graduatedStudents: 0, totalGraduates: 0 });
  }, []);

  // Seçilen fakülteye göre verileri filtreleme ve hazırlama
  const filteredData = useMemo(() => {
    return rawData
      .filter(item => item.faculty === selectedFaculty)
      .map(item => {
        // Ulaşılan Mezun Oranı hesaplama (Sıfıra bölmeyi önlemek için)
        const reachedGraduateRatio = item.totalGraduates > 0
          ? (item.graduatedStudents / item.totalGraduates) * 100
          : 0;
        return {
          ...item,
          reachedGraduateRatio,
          displayName: item.department.length > 25
            ? item.department.substring(0, 22) + '...'
            : item.department
        };
      })
      .sort((a, b) => b[dataType] - a[dataType]);
  }, [selectedFaculty, dataType]);

  // Özel Tooltip bileşeni
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;

      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label"><strong>{item.department}</strong></p>
          <p>Toplam Öğrenci Sayısı: {item.totalStudents.toLocaleString()}</p>
          <p>Toplam Mezun Sayısı: {item.totalGraduates.toLocaleString()}</p>
          <p>Ulaşılan Mezun Sayısı: {item.graduatedStudents.toLocaleString()}</p>
          <p>Ulaşılan Mezun Oranı: {item.reachedGraduateRatio.toFixed(2)}%</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Üniversite Bölüm İstatistikleri</CardTitle>

          {/* Genel Toplamlar Bölümü */}
          <div className="grid grid-cols-3 gap-4 mt-4 bg-gray-100 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Toplam Öğrenci Sayısı</p>
              <p className="text-xl font-bold">{overallTotals.totalStudents.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Ulaşılan Mezun Sayısı</p>
              <p className="text-xl font-bold">{overallTotals.graduatedStudents.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Toplam Mezun Sayısı</p>
              <p className="text-xl font-bold">{overallTotals.totalGraduates.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex space-x-4 mt-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakülte Seçin</label>
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger>
                  <SelectValue>{selectedFaculty}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {faculties.map(faculty => (
                    <SelectItem key={faculty} value={faculty}>{faculty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Veri Türü</label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue>
                    {dataType === 'graduatedStudents' 
                      ? 'Ulaşılan Mezun Sayısı' 
                      : dataType === 'totalStudents'
                      ? 'Toplam Öğrenci Sayısı'
                      : dataType === 'totalGraduates'
                      ? 'Toplam Mezun Sayısı'
                      : 'Ulaşılan Mezun Oranı (%)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="graduatedStudents">Ulaşılan Mezun Sayısı</SelectItem>
                  <SelectItem value="totalStudents">Toplam Öğrenci Sayısı</SelectItem>
                  <SelectItem value="totalGraduates">Toplam Mezun Sayısı</SelectItem>
                  <SelectItem value="reachedGraduateRatio">Ulaşılan Mezun Oranı (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={filteredData}
              layout="vertical"
              margin={{ left: 20, right: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal />
              <XAxis type="number" />
              <YAxis dataKey="displayName" type="category" width={150} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataType} radius={8} fill="hsl(var(--chart-1))" >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 6) + 1}))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default UniversityDepartmentsVisualization;
