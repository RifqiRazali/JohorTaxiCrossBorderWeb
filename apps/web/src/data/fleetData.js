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
    id: 'sedan',
    name: 'Standard Sedan',
    driverName: 'Uncle Tan',
    rate: '$150 per trip',
    seats: '4 passengers',
    luggage: '2 large bags',
    plateNumber: 'WAA 1234 A',
    whatsappNumber: '60138728630',
    image: 'https://images.hostinger.com/2e1008f3-98e6-4143-9367-c733b16daaa8.png',
    desc: 'Our everyday workhorse. Air-conditioned, spotless, and ideal for solo travellers or couples clearing immigration fast.',
  },
  {
    id: 'suv',
    name: 'Comfort SUV',
    driverName: 'Abang Johari',
    rate: '$210 per trip',
    seats: '5 passengers',
    luggage: '4 large bags',
    plateNumber: 'WBB 5678 B',
    whatsappNumber: '60138728630',
    image: 'https://images.hostinger.com/48a686e7-49e1-4cc6-b747-165c4b6797dc.png',
    desc: 'Extra legroom and a raised ride for long highway stretches. Perfect for small families with generous luggage.',
  },
  {
    id: 'alphard',
    name: 'VIP Alphard / MPV',
    driverName: 'Mr. David',
    rate: '$320 per trip',
    seats: '6 passengers',
    luggage: '5 large bags',
    plateNumber: 'WCC 9012 C',
    whatsappNumber: '60138728630',
    image: 'https://images.hostinger.com/d09c62e0-3acf-4b29-84dc-1dab72639e0d.png',
    desc: 'Captain seats, curtained privacy and onboard refreshments. The choice for executives and airport transfers.',
  },
  {
    id: 'van',
    name: '10-Seater Van',
    driverName: 'Captain Ramesh',
    rate: '$380 per trip',
    seats: '10 passengers',
    luggage: '8 large bags',
    plateNumber: 'WDD 3456 D',
    whatsappNumber: '60138728630',
    image: 'https://images.hostinger.com/a0fbf245-fb68-4b91-a587-ffce64f055c6.png',
    desc: 'One vehicle, one price, whole group together. Built for team trips, tour groups and multi-family travel.',
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
