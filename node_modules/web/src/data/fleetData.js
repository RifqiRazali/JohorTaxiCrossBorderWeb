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
    rate: 'SGD 150 per trip',
    seats: '6 passengers',
    luggage: '2 large bags',
    plateNumber: 'WAA 1234 A',
    whatsappNumber: '60138728630',
    image: '/images/fleet/vellfiretaxi.jpeg',
  },
  {
    id: 'toyota innova razali',
    name: 'Toyota Innova',
    driverName: 'Abang Johari',
    rate: 'SGD 210 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    plateNumber: 'WBB 5678 B',
    whatsappNumber: '60138728630',
    image: '/images/fleet/toyotainnovapa.jpeg',
  },
  {
    id: 'toyota innova razali',
    name: 'Toyota Innova',
    driverName: 'Abang Rifqi',
    rate: 'SGD 210 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    plateNumber: 'WBB 5678 B',
    whatsappNumber: '60138728630',
    image: '/images/fleet/toyotainnovakawan.jpeg',
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
    desc: 'Seamless transfers for Changi Airport (SIN), Senai International Airport (JHB) & Seletar Airport.',
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
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'desaru',
      name: 'Desaru Coast & Waterpark',
      location: 'Kota Tinggi, Johor',
      tag: 'Beach Resort',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'jpo',
      name: 'Johor Premium Outlets (JPO)',
      location: 'Kulai, Johor',
      tag: 'Shopping',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'jbcity',
      name: 'JB City Square & KSL City',
      location: 'Johor Bahru City',
      tag: 'City & Shopping',
      image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'mersing',
      name: 'Mersing Jetty (Tioman Gateway)',
      location: 'Mersing, Johor',
      tag: 'Island Gateway',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'senai',
      name: 'Senai International Airport (JHB)',
      location: 'Senai, Johor',
      tag: 'Airport',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    },
  ],
  singapore: [
    {
      id: 'changi',
      name: 'Changi Airport & Jewel',
      location: 'Changi, Singapore',
      tag: 'Airport & Transit',
      image: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'mbs',
      name: 'Marina Bay Sands & Gardens by the Bay',
      location: 'Marina Bay, Singapore',
      tag: 'Iconic Landmark',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sentosa',
      name: 'Resorts World Sentosa & USS',
      location: 'Sentosa Island, Singapore',
      tag: 'Theme Park & Resort',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'orchard',
      name: 'Orchard Road Shopping Belt',
      location: 'Orchard, Singapore',
      tag: 'Shopping & Dining',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
  ],
};
