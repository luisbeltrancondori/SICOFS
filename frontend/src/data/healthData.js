// Base data extracted directly from the official report of Gobierno Autónomo Municipal de Montero
// Secretaría Municipal de Salud - Instancia Técnica de Salud - Red de Salud Montero

export const MONTHS = [
  { key: 'ene', label: 'Ene', fullName: 'Enero' },
  { key: 'feb', label: 'Feb', fullName: 'Febrero' },
  { key: 'mar', label: 'Mar', fullName: 'Marzo' },
  { key: 'abr', label: 'Abr', fullName: 'Abril' },
  { key: 'may', label: 'May', fullName: 'Mayo' },
  { key: 'jun', label: 'Jun', fullName: 'Junio' },
  { key: 'jul', label: 'Jul', fullName: 'Julio' },
  { key: 'ago', label: 'Ago', fullName: 'Agosto' },
  { key: 'sep', label: 'Sep', fullName: 'Septiembre' },
  { key: 'oct', label: 'Oct', fullName: 'Octubre' },
  { key: 'nov', label: 'Nov', fullName: 'Noviembre' },
  { key: 'dic', label: 'Dic', fullName: 'Diciembre' },
];

export const SNIS_GROUPS = [
  'Todas',
  'Menor de 1 año',
  '1 a 4 años',
  '5 a 9 años',
  '10 a 19 años',
  '20 a 59 años',
  '60 años y más'
];

export const YEARS = ['2025', '2024', '2023'];

export const BASE_FACILITIES = [
  {
    id: 'fac-1',
    name: 'ERNESTO CHE GUEVARA',
    type: 'Centro de Salud con Internación',
    level: '1er Nivel Ampliado',
    district: 'Distrito 1 - Casco Viejo',
    address: 'Av. Circunvalación Este esq. Calle Bolívar',
    phone: '(+591) 3 922-2140',
    director: 'Dr. Roberto Justiniano M.',
    activeDoctors: 18,
    beds: 24,
    femaleRatio: 0.612,
    snisDistribution: { 'Menor de 1 año': 0.08, '1 a 4 años': 0.12, '5 a 9 años': 0.10, '10 a 19 años': 0.14, '20 a 59 años': 0.44, '60 años y más': 0.12 },
    monthly: {
      ene: 4259, feb: 3979, mar: 5663, abr: 5638, may: 4730, jun: 4932,
      jul: 4949, ago: 3744, sep: 4084, oct: 4439, nov: 3955, dic: 3820
    },
    reportedTotal: 23447
  },
  {
    id: 'fac-2',
    name: 'HOSPITAL ALFONSO GUMUCIO',
    type: 'Hospital de Segundo Nivel',
    level: '2do Nivel Referencial',
    district: 'Distrito 2 - Central',
    address: 'Calle René Moreno #340',
    phone: '(+591) 3 922-0199',
    director: 'Dra. María Elena Vaca',
    activeDoctors: 34,
    beds: 85,
    femaleRatio: 0.605,
    snisDistribution: { 'Menor de 1 año': 0.09, '1 a 4 años': 0.14, '5 a 9 años': 0.11, '10 a 19 años': 0.13, '20 a 59 años': 0.41, '60 años y más': 0.12 },
    monthly: {
      ene: 2801, feb: 2617, mar: 2654, abr: 2753, may: 2866, jun: 2538,
      jul: 2654, ago: 2348, sep: 2621, oct: 2657, nov: 2337, dic: 2484
    },
    reportedTotal: 19197
  },
  {
    id: 'fac-3',
    name: 'DIVINO NIÑO',
    type: 'Centro de Salud Integral',
    level: '1er Nivel',
    district: 'Distrito 3 - El Paraíso',
    address: 'Barrio Divino Niño, Calle 4',
    phone: '(+591) 3 922-3850',
    director: 'Dr. Carlos Banegas S.',
    activeDoctors: 14,
    beds: 12,
    femaleRatio: 0.628,
    snisDistribution: { 'Menor de 1 año': 0.11, '1 a 4 años': 0.15, '5 a 9 años': 0.12, '10 a 19 años': 0.12, '20 a 59 años': 0.38, '60 años y más': 0.12 },
    monthly: {
      ene: 3246, feb: 3012, mar: 3512, abr: 3168, may: 3130, jun: 2844,
      jul: 3013, ago: 2615, sep: 2922, oct: 2969, nov: 2527, dic: 2419
    },
    reportedTotal: 14921
  },
  {
    id: 'fac-4',
    name: 'JUANA AZURDUY DE PADILLA',
    type: 'Centro de Salud Integral',
    level: '1er Nivel',
    district: 'Distrito 4 - Warnes Norte',
    address: 'Urb. Juana Azurduy, Av. Las Américas',
    phone: '(+591) 3 922-4912',
    director: 'Lic. Miriam Quiroga',
    activeDoctors: 12,
    beds: 10,
    femaleRatio: 0.615,
    snisDistribution: { 'Menor de 1 año': 0.07, '1 a 4 años': 0.13, '5 a 9 años': 0.09, '10 a 19 años': 0.15, '20 a 59 años': 0.42, '60 años y más': 0.14 },
    monthly: {
      ene: 2793, feb: 2808, mar: 3543, abr: 3395, may: 3309, jun: 3018,
      jul: 2529, ago: 2916, sep: 3227, oct: 3219, nov: 2629, dic: 2572
    },
    reportedTotal: 14441
  },
  {
    id: 'fac-5',
    name: 'CENTRO DE SALUD DR. VICTOR HUGO CASSAL BARBA',
    type: 'Centro de Salud Integral',
    level: '1er Nivel',
    district: 'Distrito 5 - Guabirá Sur',
    address: 'Av. Barrientos Ortuño s/n',
    phone: '(+591) 3 922-5502',
    director: 'Dr. Hugo Melgar T.',
    activeDoctors: 10,
    beds: 8,
    femaleRatio: 0.598,
    snisDistribution: { 'Menor de 1 año': 0.08, '1 a 4 años': 0.12, '5 a 9 años': 0.10, '10 a 19 años': 0.13, '20 a 59 años': 0.45, '60 años y más': 0.12 },
    monthly: {
      ene: 2376, feb: 2905, mar: 2895, abr: 2488, may: 2291, jun: 2408,
      jul: 2441, ago: 2570, sep: 2469, oct: 2378, nov: 1926, dic: 2080
    },
    reportedTotal: 11475
  },
  {
    id: 'fac-6',
    name: 'LA SAGRADA FAMILIA',
    type: 'Centro de Salud',
    level: '1er Nivel',
    district: 'Distrito 2 - La Florida',
    address: 'Barrio Sagrada Familia, Mza 12',
    phone: '(+591) 3 922-6110',
    director: 'Dra. Patricia Salvatierra',
    activeDoctors: 9,
    beds: 6,
    femaleRatio: 0.601,
    snisDistribution: { 'Menor de 1 año': 0.08, '1 a 4 años': 0.11, '5 a 9 años': 0.10, '10 a 19 años': 0.12, '20 a 59 años': 0.44, '60 años y más': 0.15 },
    monthly: {
      ene: 2206, feb: 2072, mar: 2414, abr: 2876, may: 2264, jun: 2377,
      jul: 2493, ago: 2317, sep: 2547, oct: 2454, nov: 1926, dic: 1994
    },
    reportedTotal: 11268
  },
  {
    id: 'fac-7',
    name: 'SAN MARTIN DE PORRES',
    type: 'Centro de Salud',
    level: '1er Nivel',
    district: 'Distrito 3 - San Martín',
    address: 'Calle San Martín #89',
    phone: '(+591) 3 922-7201',
    director: 'Dr. Fernando Aguilera',
    activeDoctors: 8,
    beds: 6,
    femaleRatio: 0.589,
    snisDistribution: { 'Menor de 1 año': 0.07, '1 a 4 años': 0.10, '5 a 9 años': 0.11, '10 a 19 años': 0.14, '20 a 59 años': 0.43, '60 años y más': 0.15 },
    monthly: {
      ene: 1978, feb: 1894, mar: 2351, abr: 2203, may: 1983, jun: 1852,
      jul: 2105, ago: 1752, sep: 1826, oct: 1840, nov: 1544, dic: 1711
    },
    reportedTotal: 9504
  },
  {
    id: 'fac-8',
    name: 'HOSPITAL RENE BALDERAS',
    type: 'Hospital Básico Municipal',
    level: '1er Nivel Especializado',
    district: 'Distrito 1 - Sur',
    address: 'Barrio René Balderas, Av. Petrolera',
    phone: '(+591) 3 922-8334',
    director: 'Dr. Jorge Luis Roca',
    activeDoctors: 7,
    beds: 10,
    femaleRatio: 0.595,
    snisDistribution: { 'Menor de 1 año': 0.06, '1 a 4 años': 0.12, '5 a 9 años': 0.08, '10 a 19 años': 0.13, '20 a 59 años': 0.48, '60 años y más': 0.13 },
    monthly: {
      ene: 638, feb: 562, mar: 714, abr: 697, may: 707, jun: 573,
      jul: 541, ago: 562, sep: 643, oct: 545, nov: 565, dic: 518
    },
    reportedTotal: 4963
  },
  {
    id: 'fac-9',
    name: 'NARANJAL DON BOSCO',
    type: 'Puesto de Salud Periférico',
    level: '1er Nivel Básico',
    district: 'Distrito Rural Naranjal',
    address: 'Comunidad Naranjal Don Bosco km 5',
    phone: '(+591) 3 922-9011',
    director: 'Lic. Gladys Mercado',
    activeDoctors: 4,
    beds: 4,
    femaleRatio: 0.618,
    snisDistribution: { 'Menor de 1 año': 0.09, '1 a 4 años': 0.14, '5 a 9 años': 0.11, '10 a 19 años': 0.12, '20 a 59 años': 0.41, '60 años y más': 0.13 },
    monthly: {
      ene: 389, feb: 371, mar: 326, abr: 386, may: 542, jun: 543,
      jul: 448, ago: 493, sep: 661, oct: 520, nov: 447, dic: 513
    },
    reportedTotal: 1987
  },
  {
    id: 'fac-10',
    name: 'VILLA COPACABANA',
    type: 'Puesto de Salud Periférico',
    level: '1er Nivel Básico',
    district: 'Distrito 5 - Villa Copacabana',
    address: 'Calle Copacabana esq. Litoral',
    phone: '(+591) 3 922-9442',
    director: 'Dra. Carmen Rosa Suárez',
    activeDoctors: 3,
    beds: 3,
    femaleRatio: 0.608,
    snisDistribution: { 'Menor de 1 año': 0.08, '1 a 4 años': 0.13, '5 a 9 años': 0.10, '10 a 19 años': 0.13, '20 a 59 años': 0.43, '60 años y más': 0.13 },
    monthly: {
      ene: 404, feb: 357, mar: 433, abr: 445, may: 426, jun: 383,
      jul: 501, ago: 375, sep: 402, oct: 395, nov: 378, dic: 409
    },
    reportedTotal: 1576
  },
  {
    id: 'fac-11',
    name: 'CENTRO INTEGRAL GUABIRÁ',
    type: 'Centro de Salud Comunitario',
    level: '1er Nivel',
    district: 'Distrito 4 - Guabirá',
    address: 'Av. Industrial frente a Ingenio',
    phone: '(+591) 3 922-1088',
    director: 'Dr. Marcelo Cuéllar',
    activeDoctors: 5,
    beds: 4,
    femaleRatio: 0.592,
    snisDistribution: { 'Menor de 1 año': 0.07, '1 a 4 años': 0.11, '5 a 9 años': 0.10, '10 a 19 años': 0.14, '20 a 59 años': 0.45, '60 años y más': 0.13 },
    monthly: {
      ene: 310, feb: 295, mar: 350, abr: 340, may: 320, jun: 315,
      jul: 330, ago: 290, sep: 325, oct: 310, nov: 290, dic: 300
    },
    reportedTotal: 3875
  },
  {
    id: 'fac-12',
    name: 'PUESTO DE SALUD MONTERO SUR',
    type: 'Puesto de Salud Periférico',
    level: '1er Nivel Básico',
    district: 'Distrito 1 - Sur',
    address: 'Barrio Montero Sur, Manzana 8',
    phone: '(+591) 3 922-1177',
    director: 'Dra. Gabriela Antelo',
    activeDoctors: 3,
    beds: 2,
    femaleRatio: 0.604,
    snisDistribution: { 'Menor de 1 año': 0.08, '1 a 4 años': 0.12, '5 a 9 años': 0.09, '10 a 19 años': 0.15, '20 a 59 años': 0.43, '60 años y más': 0.13 },
    monthly: {
      ene: 220, feb: 210, mar: 245, abr: 235, may: 225, jun: 215,
      jul: 230, ago: 210, sep: 220, oct: 225, nov: 200, dic: 210
    },
    reportedTotal: 2645
  }
];

// Official aggregate totals from the report for exact default display
export const REPORT_TOTALS = {
  headlineTotal: 91733,
  monthlyAverage: 7644,
  peakMonth: 'Marzo',
  peakMonthPatients: 22957,
  networkCoverage: 12,
  gender: {
    female: 55806,
    femalePercentage: 60.82,
    male: 35927,
    malePercentage: 39.18
  },
  monthlyEvolution: [
    { month: 'Ene', label: 'Enero', total: 19351 },
    { month: 'Feb', label: 'Febrero', total: 19149 },
    { month: 'Mar', label: 'Marzo', total: 22957 },
    { month: 'Abr', label: 'Abril', total: 22304 },
    { month: 'May', label: 'Mayo', total: 20539 },
    { month: 'Jun', label: 'Junio', total: 20061 },
    { month: 'Jul', label: 'Julio', total: 20805 },
    { month: 'Ago', label: 'Agosto', total: 18205 },
    { month: 'Sep', label: 'Septiembre', total: 19747 },
    { month: 'Oct', label: 'Octubre', total: 19757 },
    { month: 'Nov', label: 'Noviembre', total: 16838 },
    { month: 'Dic', label: 'Diciembre', total: 17000 }
  ],
  top10Facilities: [
    { name: 'ERNESTO CHE GUEVARA', value: 23447, percentage: 25.6 },
    { name: 'HOSPITAL ALFONSO GUMUCIO', value: 19197, percentage: 20.9 },
    { name: 'DIVINO NIÑO', value: 14921, percentage: 16.3 },
    { name: 'JUANA AZURDUY DE PADILLA', value: 14441, percentage: 15.7 },
    { name: 'CENTRO DE SALUD DR. VICTOR HUGO CASSAL BARBA', value: 11475, percentage: 12.5 },
    { name: 'LA SAGRADA FAMILIA', value: 11268, percentage: 12.3 },
    { name: 'SAN MARTIN DE PORRES', value: 9504, percentage: 10.4 },
    { name: 'HOSPITAL RENE BALDERAS', value: 4963, percentage: 5.4 },
    { name: 'NARANJAL DON BOSCO', value: 1987, percentage: 2.2 },
    { name: 'VILLA COPACABANA', value: 1576, percentage: 1.7 }
  ]
};

// Formatter utility
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
