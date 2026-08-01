/**
 * Website Configuration & Data File
 * 
 * All website items (Cars, Services, and Tourist Destinations) are managed in this single file.
 * Adding, editing, or deleting items here will automatically update the website!
 */

// Fallback WhatsApp number for general inquiries & dispatch
export const DEFAULT_WHATSAPP_NUMBER = '60138728630';


/* ==========================================================================
   1. CAR FLEET LIST
   To add a car: Add a new object to FLEET array.
   To remove a car: Delete its object from FLEET array.
   ========================================================================== */
export const FLEET = [
  {
    id: 'vellfire taxi',
    name: 'Vellfire Taxi',
    driverName: 'Uncle Tan',
    rate: 'SGD 220 per trip',
    seats: '6 passengers',
    luggage: '2 large bags',
    whatsappNumber: '60138728630',
    image: '/images/fleet/vellfiretaxi.jpeg',
  },
  {
    id: 'tinnova-razali',
    name: 'Toyota Innova',
    driverName: 'Mr. Razali',
    rate: 'SGD 120 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    whatsappNumber: '601137433099',
    image: '/images/fleet/toyotainnovapa.jpeg',
  },
  {
    id: 'tinnova-kawan',
    name: 'Toyota Innova',
    driverName: 'Mr. ?',
    rate: 'SGD 120 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    whatsappNumber: '60127942974',
    image: '/images/fleet/toyotainnovakawan.jpeg',
  },
  {
    id: 'tinnova-elmee',
    name: 'Toyota Innova',
    driverName: 'Mr. Elmee',
    rate: 'SGD 120 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    whatsappNumber: '60106656136',
    image: '/images/fleet/toyotainnovaelmee.jpeg',
  },
  {
    id: 'tinnova-kawan2',
    name: 'Toyota Innova',
    driverName: 'Mr. ?',
    rate: 'SGD 120 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    whatsappNumber: '60127531753',
    image: '/images/fleet/toyotainnovakawan2.jpeg',
  },
];


/* ==========================================================================
   2. SERVICES LIST
   To add a service: Add a new object to SERVICES array.
   To remove a service: Delete its object from SERVICES array.
   ========================================================================== */
export const SERVICES = [
  {
    id: 'airport',
    title: 'AIRPORT TRANSFER',
    desc: 'Seamless transfers for Changi Airport (SG), Senai International Airport (JHB) & Seletar Airport.',
    image: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'corporate',
    title: 'CORPORATE JOB',
    desc: '5-star executive transport for business meetings, cross-border corporate events & VIP clients.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tour',
    title: 'PRIVATE TOUR',
    desc: 'Customized day tours to top attractions across Singapore and Johor with comfortable private rides.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'outstation',
    title: 'OUTSTATION TRIP',
    desc: 'Long-distance transfers to Desaru, Malacca, Genting Highlands, Mersing Jetty & beyond.',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
  },
];


/* ==========================================================================
   3. TOURIST DESTINATIONS LIST
   To add a spot: Add a new object to `johor` or `singapore` array.
   To remove a spot: Delete its object from the array.
   ========================================================================== */
export const DESTINATIONS = {
  johor: [
    {
      id: 'legoland',
      name: 'Legoland Malaysia & Sea Life',
      location: 'Iskandar Puteri, Johor',
      tag: 'Theme Park',
      image: '/images/destinations/legoland.png',
    },
    {
      id: 'desaru',
      name: 'Desaru Coast & Waterpark',
      location: 'Kota Tinggi, Johor',
      tag: 'Beach Resort',
      image: '/images/destinations/desaru.png',
    },
    {
      id: 'jpo',
      name: 'Johor Premium Outlets (JPO)',
      location: 'Kulai, Johor',
      tag: 'Shopping',
      image: '/images/destinations/jpo.png',
    },
    {
      id: 'jbcity',
      name: 'JB City Square & KSL City',
      location: 'Johor Bahru City',
      tag: 'City & Shopping',
      image: '/images/destinations/jbcity.png',
    },
    {
      id: 'mersing',
      name: 'Mersing Jetty (Tioman Gateway)',
      location: 'Mersing, Johor',
      tag: 'Island Gateway',
      image: '/images/destinations/mersing.png',
    },
    {
      id: 'senai',
      name: 'Senai International Airport (JHB)',
      location: 'Senai, Johor',
      tag: 'Airport',
      image: '/images/destinations/senai.png',
    },
  ],
  singapore: [
    {
      id: 'changi',
      name: 'Changi Airport & Jewel',
      location: 'Changi, Singapore',
      tag: 'Airport & Transit',
      image: '/images/destinations/changi.png',
    },
    {
      id: 'mbs',
      name: 'Marina Bay Sands & Gardens by the Bay',
      location: 'Marina Bay, Singapore',
      tag: 'Iconic Landmark',
      image: '/images/destinations/mbs.png',
    },
    {
      id: 'sentosa',
      name: 'Resorts World Sentosa & USS',
      location: 'Sentosa Island, Singapore',
      tag: 'Theme Park & Resort',
      image: '/images/destinations/sentosa.png',
    },
    {
      id: 'orchard',
      name: 'Orchard Road Shopping Belt',
      location: 'Orchard, Singapore',
      tag: 'Shopping & Dining',
      image: '/images/destinations/orchard.png',
    },
  ],
};
