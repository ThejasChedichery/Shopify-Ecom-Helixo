
import mongoose from "mongoose";

const timerSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true },   // Link timer to Shopify store
  startDate: { type: Date, required: true },      // Timer start date/time
  endDate: { type: Date, required: true },        // Timer end date/time
  description: { type: String, default: 'Special Promotion' }, // Timer text

  displayOptions: {
    color: { type: String, default: '#FF0000' },   // Timer color
    size: { type: String, default: 'medium' },     // small / medium / large
    position: { type: String, default: 'top' }     // top / bottom /floating
  },

  urgencySettings: {
    enableBanner: { type: String, default: 'color pulse' },   // color pulse/banner notification / blinking effect
    warningTimeMinutes: { type: Number, default: 5 }  // Last X minutes
  },

},{timestamps:true});

const Timer = mongoose.model('Timer', timerSchema);
export default Timer;
