
import React from 'react';
import { TripSegment } from './types';

export const ITALIAN_CITIES: TripSegment[] = [
  { 
    id: 'day-1', 
    title: 'Day 1: Arrival in Rome', 
    location: 'Fiumicino', 
    description: 'May 2, 2026: Arrival at FCO 23:40. Late night check-in.', 
    milestone: 'Touching down in the Eternal City. Our twenty-year journey begins under the soft glow of the Roman stars.',
    image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/520137720.jpg?k=2019ebfed81f5f12fc2b35c3522658550a75f9fb8d22e79d7789a199a432bf21&o=',
    itineraryContext: 'Arriving at FCO late. Staying in Fiumicino village at Fishing Harbour Loft to recover from the long flight before picking up the car.',
    mapUrl: 'https://www.google.com/maps/dir/Fiumicino+Airport,+Rome/Fishing+Harbour+Loft,+Fiumicino',
    center: { lat: 41.77, lng: 12.24 },
    zoom: 13,
    plannedStops: [
      { title: 'Rome Fiumicino (FCO)', uri: 'https://www.google.com/maps/search/?api=1&query=Rome+Fiumicino+Airport', type: 'sight', lat: 41.7999, lng: 12.2462 },
      { title: 'Fishing Harbour Loft', uri: 'https://www.booking.com/Share-BnwOlK0', type: 'hotel', lat: 41.7735, lng: 12.2397 }
    ]
  },
  { 
    id: 'day-2', 
    title: 'Day 2: Lazio to Orvieto', 
    location: 'Bagnoregio & Bolsena', 
    description: 'May 3, 2026: Pick up Jeep. Visit the "Dying City" and volcanic lakes.', 
    milestone: 'From the quiet coast to the heights of the tuff cliffs. Orvieto awaits with its golden cathedral facade.',
    image: 'https://civitavecchia.portmobility.it/sites/default/files/civita_di_bagnoregio.jpg',
    itineraryContext: 'The true start of our driving adventure. Heading into the tuff-town region of Lazio and Umbria, visiting a cliffside village accessible only by footbridge.',
    mapUrl: 'https://www.google.com/maps/dir/Fiumicino/Montefiascone/Civita+di+Bagnoregio/Lake+Bolsena+Viewpoint/Orvieto',
    center: { lat: 42.55, lng: 12.10 },
    zoom: 10,
    plannedStops: [
      { title: 'Montefiascone', uri: 'https://www.google.com/maps/search/?api=1&query=Montefiascone+Viterbo', type: 'sight', lat: 42.5376, lng: 12.0308 },
      { title: 'Civita di Bagnoregio', uri: 'https://www.google.com/maps/search/?api=1&query=Civita+di+Bagnoregio', type: 'sight', lat: 42.6277, lng: 12.1135 },
      { title: 'Alma Civita (Lunch)', uri: 'https://maps.app.goo.gl/FPhnH54aJaWsrztTA', type: 'restaurant', lat: 42.6275, lng: 12.1130 },
      { title: 'Lake Bolsena Viewpoint', uri: 'https://www.google.com/maps/search/?api=1&query=Lake+Bolsena+Panoramic+Viewpoint', type: 'sight', lat: 42.6486, lng: 11.9891 },
      { title: 'Pozzo di San Patrizio', uri: 'https://maps.app.goo.gl/BP766FvRMafP9Wpb9', type: 'sight', lat: 42.7166, lng: 12.1150 },
      { title: 'Terrazza Clementini', uri: 'https://www.booking.com/Share-Pa0G10', type: 'hotel', lat: 42.7165, lng: 12.1051 },
      { title: 'La Palomba (Dinner)', uri: 'https://maps.app.goo.gl/FrnxPLAoLHjXZnjAA', type: 'restaurant', lat: 42.7182, lng: 12.1102 }
    ]
  },
  { 
    id: 'day-3', 
    title: 'Day 3: To Val d\'Orcia', 
    location: 'Montalcino & San Gimignano', 
    description: 'May 4, 2026: Abbey of Sant\'Antimo and the towers of San Gimignano.', 
    milestone: 'Entering the "Medieval Manhattan". Toasting to twenty years together amidst the soaring towers of San Gimignano.',
    image: 'https://www.italia.it/content/dam/tdh/en/interests/toscana/san-gimignano-la-manhattan-del-medioevo/media/20220222160016-san-gimignano-toscana-shutterstock-1413457445.jpg',
    itineraryContext: 'Crossing into Tuscany. A day of tall towers, spiritual chanting at an abbey, and the first taste of Brunello wine territory.',
    mapUrl: 'https://www.google.com/maps/dir/Orvieto/Abbazia+di+Sant\'Antimo/Montalcino/San+Gimignano/Monteriggioni/San+Quirico+d\'Orcia',
    center: { lat: 43.20, lng: 11.45 },
    zoom: 9,
    plannedStops: [
      { title: 'Abbazia di Sant\'Antimo', uri: 'https://www.google.com/maps/search/?api=1&query=Abbazia+di+Sant\'Antimo', type: 'sight', lat: 42.9997, lng: 11.5155 },
      { title: 'Montalcino Viewpoint', uri: 'https://www.google.com/maps/search/?api=1&query=Fortezza+di+Montalcino', type: 'sight', lat: 43.0581, lng: 11.4891 },
      { title: 'Fattoria Poggio Alloro (Lunch)', uri: 'https://maps.app.goo.gl/KQHuWWJsLZTFDTYv7', type: 'restaurant', lat: 43.4872, lng: 11.0644 },
      { title: 'San Gimignano Towers', uri: 'https://www.google.com/maps/search/?api=1&query=San+Gimignano+Towers', type: 'sight', lat: 43.4677, lng: 11.0428 },
      { title: 'Colle Val d\'Elsa', uri: 'https://www.google.com/maps/search/?api=1&query=Colle+di+Val+d\'Elsa+Centro+Storico', type: 'sight', lat: 43.4247, lng: 11.1244 },
      { title: 'Monteriggioni Fortress', uri: 'https://www.google.com/maps/search/?api=1&query=Monteriggioni+Castle', type: 'sight', lat: 43.3899, lng: 11.2235 },
      { title: 'La Torre House', uri: 'https://www.booking.com/Share-IwdTmvX', type: 'hotel', lat: 43.0575, lng: 11.6015 },
      { title: 'Vecchio Forno (Dinner)', uri: 'https://maps.app.goo.gl/3KNSZvGMUbku8Get7', type: 'restaurant', lat: 43.0585, lng: 11.6050 }
    ]
  },
  { 
    id: 'day-4', 
    title: 'Day 4: Val d\'Orcia Slow', 
    location: 'Pienza & Bagno Vignoni', 
    description: 'May 5, 2026: Sunrise at Belvedere and the Gladiator homecoming road.', 
    milestone: 'Chasing the golden light. Watching the mist rise over the world\'s most beautiful rolling hills as we celebrate twenty years.',
    image: 'https://www.sommertage.com/wp-content/uploads/2021/11/Fotospots-Val-d-Orcia.jpg',
    itineraryContext: 'Relaxed exploration of the iconic rolling hills. We\'ll visit thermal pools and the cypress-lined roads made famous by film.',
    mapUrl: 'https://www.google.com/maps/dir/San+Quirico+d\'Orcia/Podere+Belvedere/Bagno+Vignoni/Pienza/Madonna+di+Vitaleta/San+Quirico+d\'Orcia',
    center: { lat: 43.06, lng: 11.65 },
    zoom: 12,
    plannedStops: [
      { title: 'Podere Belvedere (Sunrise)', uri: 'https://maps.app.goo.gl/bYe1d4JcBzsbr2MD9', type: 'sight', lat: 43.0645, lng: 11.6115 },
      { title: 'Bagno Vignoni', uri: 'https://www.google.com/maps/search/?api=1&query=Bagno+Vignoni+Thermal+Pools', type: 'sight', lat: 43.0289, lng: 11.6195 },
      { title: 'Podere Il Casale (Lunch)', uri: 'https://maps.app.goo.gl/7kDp63DPVpJj1EBd7', type: 'restaurant', lat: 43.0808, lng: 11.7116 },
      { title: 'Pienza Duomo', uri: 'https://www.google.com/maps/search/?api=1&query=Pienza+Duomo', type: 'sight', lat: 43.0761, lng: 11.6789 },
      { title: 'Gladiator Road (SP146)', uri: 'https://maps.app.goo.gl/YtEYn34tb392r9N2A', type: 'sight', lat: 43.0625, lng: 11.6645 },
      { title: 'Madonna di Vitaleta', uri: 'https://www.google.com/maps/search/?api=1&query=Cappella+Madonna+di+Vitaleta', type: 'sight', lat: 43.0708, lng: 11.6343 },
      { title: 'Da Ciacco (Dinner)', uri: 'https://maps.app.goo.gl/4jkkh6aUxacPdt2a7', type: 'restaurant', lat: 43.0570, lng: 11.6010 }
    ]
  },
  { 
    id: 'day-5', 
    title: 'Day 5: Anniversary Day', 
    location: 'Saturnia & Sorano', 
    description: 'May 6, 2026: Cascate del Mulino thermal soak and Maremma exploration.', 
    milestone: 'Twenty years later, still soaking in the magic of life together at the turquoise thermal springs.',
    image: 'https://static.saltinourhair.com/wp-content/uploads/2019/05/23135632/Hot-Springs-Tuscany-Saturnia.jpg',
    itineraryContext: 'Our special day. An early morning soak in natural hot springs followed by a candlelit dinner in a quiet hilltop borgo.',
    mapUrl: 'https://www.google.com/maps/dir/San+Quirico+d\'Orcia/Radicofani/Pitigliano/Cascate+del+Mulino/Sorano/Sovana/Monticchiello',
    center: { lat: 42.75, lng: 11.65 },
    zoom: 10,
    plannedStops: [
      { title: 'Radicofani Fortress', uri: 'https://www.google.com/maps/search/?api=1&query=Radicofani+Fortress', type: 'sight', lat: 42.8967, lng: 11.7672 },
      { title: 'Pitigliano Panoramico', uri: 'https://www.google.com/maps/search/?api=1&query=Pitigliano+Panoramic+Point', type: 'sight', lat: 42.6333, lng: 11.6667 },
      { title: 'Cascate del Mulino', uri: 'https://maps.app.goo.gl/xLD5mWMEKsgkDSVL7', type: 'sight', lat: 42.6483, lng: 11.5125 },
      { title: 'Hosteria del Borgo (Lunch)', uri: 'https://maps.app.goo.gl/nUR4tkzT5LMeZ95x8', type: 'restaurant', lat: 42.6820, lng: 11.7140 },
      { title: 'Sorano Masso Leopoldino', uri: 'https://www.google.com/maps/search/?api=1&query=Sorano+Masso+Leopoldino', type: 'sight', lat: 42.6817, lng: 11.7139 },
      { title: 'Sovana Medievale', uri: 'https://www.google.com/maps/search/?api=1&query=Sovana+Centro+Storico', type: 'sight', lat: 42.6577, lng: 11.6434 },
      { title: 'Osteria La Porta (Anniversary)', uri: 'https://maps.app.goo.gl/tvB9NqcH83jFiMGe9', type: 'restaurant', lat: 43.0645, lng: 11.7225 }
    ]
  },
  { 
    id: 'day-6', 
    title: 'Day 6: Umbria Bound', 
    location: 'Montepulciano & Spello', 
    description: 'May 7, 2026: Across Lake Trasimeno to the flower-lined streets of Spello.', 
    milestone: 'Discovering the "Green Heart" of Italy. Spello awaits with its cobblestones carpeted in May blooms.',
    image: 'https://media.istockphoto.com/id/531539378/photo/floral-streets-of-spello-in-umbria-italy.jpg?s=612x612&w=0&k=20&c=SPKT4qa4jegKXhH2SmBY9-AAFsvpbIbFaglRkRSi9pw=',
    itineraryContext: 'Moving east into the "Green Heart" of Italy. Spello is known for its incredible floral displays and medieval charm.',
    mapUrl: 'https://www.google.com/maps/dir/San+Quirico+d\'Orcia/Montepulciano/Castiglione+del+Lago/Perugia/Spello',
    center: { lat: 43.08, lng: 12.20 },
    zoom: 9,
    plannedStops: [
      { title: 'Montepulciano Piazza Grande', uri: 'https://www.google.com/maps/search/?api=1&query=Piazza+Grande+Montepulciano', type: 'sight', lat: 43.0925, lng: 11.7811 },
      { title: 'Castiglione del Lago', uri: 'https://www.google.com/maps/search/?api=1&query=Castiglione+del+Lago+Castle', type: 'sight', lat: 43.1278, lng: 12.0515 },
      { title: 'Ristorante del Sole (Lunch)', uri: 'https://maps.app.goo.gl/t3QbuEpBNyybH1Qc7', type: 'restaurant', lat: 43.1107, lng: 12.3908 },
      { title: 'Spello (Un Balcone su Spello)', uri: 'https://www.booking.com/Share-hHubeQE', type: 'hotel', lat: 42.9922, lng: 12.6675 },
      { title: 'Osteria del Buchetto (Dinner)', uri: 'https://maps.app.goo.gl/seB27Ni77qi57zmR8', type: 'restaurant', lat: 42.9910, lng: 12.6685 }
    ]
  },
  { 
    id: 'day-7', 
    title: 'Day 7: Via Appia Antica', 
    location: 'Spoleto & Ancient Rome', 
    description: 'May 8, 2026: Walking the ancient basalt paving stones toward Ostia.', 
    milestone: 'Walking in the footsteps of emperors. The ancient stones of the Appian Way guide us toward the sea after twenty wonderful years.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Paesaggio_dell%27Appia_antica.jpg',
    itineraryContext: 'A journey through time. From the towering bridge of Spoleto to the first "superhighway" of the Roman Empire.',
    mapUrl: 'https://www.google.com/maps/dir/Spello/Foligno/Spoleto/Lago+di+Corbara/Via+Appia+Antica/Ostia',
    center: { lat: 42.20, lng: 12.50 },
    zoom: 8,
    plannedStops: [
      { title: 'Foligno Market', uri: 'https://www.google.com/maps/search/?api=1&query=Piazza+della+Repubblica+Foligno', type: 'sight', lat: 42.9560, lng: 12.7035 },
      { title: 'Spoleto Aqueduct', uri: 'https://www.google.com/maps/search/?api=1&query=Spoleto+Ponte+delle+Torri', type: 'sight', lat: 42.7350, lng: 12.7425 },
      { title: 'Lago di Corbara', uri: 'https://www.google.com/maps/search/?api=1&query=Lago+di+Corbara+Viewpoint', type: 'sight', lat: 42.7150, lng: 12.2350 },
      { title: 'Via Appia Antica (Rome)', uri: 'https://www.google.com/maps/search/?api=1&query=Via+Appia+Antica+Park+Rome', type: 'sight', lat: 41.8562, lng: 12.5149 },
      { title: 'Tomb of Cecilia Metella', uri: 'https://www.google.com/maps/search/?api=1&query=Tomb+of+Cecilia+Metella', type: 'sight', lat: 41.8520, lng: 12.5205 },
      { title: 'Ostia Antica Ruins', uri: 'https://www.google.com/maps/search/?api=1&query=Ostia+Antica+Archaeological+Park', type: 'sight', lat: 41.7615, lng: 12.2855 },
      { title: 'Paja & Fieno (Dinner)', uri: 'https://maps.app.goo.gl/rNGwG2QZ3YC39G3g7', type: 'restaurant', lat: 41.7300, lng: 12.2800 }
    ]
  },
  { 
    id: 'day-8', 
    title: 'Day 8: Departure', 
    location: 'Ostia to FCO', 
    description: 'May 9, 2026: Final morning in Ostia. Return Jeep to FCO for 20:05 flight.', 
    milestone: 'A final breath of Mediterranean air. Our loop is complete, our twenty-year celebration has its anchor.',
    image: 'https://cdn.shortpixel.ai/spai/q_lossy+w_977+h_549+to_auto+ret_img/www.rome.info/wp-content/uploads/f-fiumicino-airport-sign.jpg',
    itineraryContext: 'The final leg. Coastal air in Ostia before completing the loop back to Fiumicino for our flight home.',
    mapUrl: 'https://www.google.com/maps/dir/Ostia/Rome+Fiumicino+Airport',
    center: { lat: 41.77, lng: 12.26 },
    zoom: 12,
    plannedStops: [
      { title: 'Lido di Ostia', uri: 'https://www.google.com/maps/search/?api=1&query=Lido+di+Ostia+Beach', type: 'sight', lat: 41.7315, lng: 12.2745 },
      { title: 'FCO Car Return', uri: 'https://www.google.com/maps/search/?api=1&query=Fiumicino+Airport+Car+Rental+Return', type: 'sight', lat: 41.7950, lng: 12.2515 }
    ]
  },
];

export const Icons = {
  Map: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Route: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Chat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  Compass: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Journal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  External: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Weather: {
    sunny: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    cloudy: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    rainy: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
      </svg>
    ),
    partlyCloudy: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    stormy: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
};
