import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csqtsflaklabqsnjlioy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXRzZmxha2xhYnFzbmpsaW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDYxMTMsImV4cCI6MjA1NzEyMjExM30.FtAAPtRd4at3nrkRIPL-OM9pBwnLyddvqf1fY84ZF7k';  // คีย์สำหรับเชื่อมต่อ (ไปที่ Supabase Dashboard แล้วหา API Key)

export const supabase = createClient(supabaseUrl, supabaseKey);
