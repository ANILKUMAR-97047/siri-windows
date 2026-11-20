import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding initial operational data into Supabase...');

  // 1. Staff
  const { data: staffList, error: staffErr } = await supabase.from('staff').upsert([
    {
      name: 'K. Nageswara Rao',
      role: 'Senior Site Supervisor',
      department: 'Operations',
      phone: '+91 94402 11001',
      base_salary: 28000,
      join_date: '2021-05-12',
      status: 'active'
    },
    {
      name: 'S. Rambabu',
      role: 'Lead UPVC Fabricator',
      department: 'Workshop / Factory',
      phone: '+91 98481 22334',
      base_salary: 24000,
      join_date: '2022-08-05',
      status: 'active'
    },
    {
      name: 'P. Venkanna',
      role: 'Master Glass Cutter & Glazier',
      department: 'Workshop / Factory',
      phone: '+91 97003 44556',
      base_salary: 22000,
      join_date: '2023-02-10',
      status: 'active'
    },
    {
      name: 'M. Durga Prasad',
      role: 'Site Installation Lead',
      department: 'Field Installation',
      phone: '+91 96180 77889',
      base_salary: 21000,
      join_date: '2024-01-14',
      status: 'active'
    },
    {
      name: 'Ch. Srinivas',
      role: 'Sales & Client Measurement Officer',
      department: 'Sales & Marketing',
      phone: '+91 98495 66778',
      base_salary: 25000,
      join_date: '2023-11-01',
      status: 'active'
    }
  ], { onConflict: 'email' }).select();

  if (staffErr) console.error('Staff error:', staffErr.message);
  else console.log(`✅ Seeded ${staffList.length} staff members!`);

  // 2. Clients
  const { data: clientsList, error: clientErr } = await supabase.from('clients').upsert([
    {
      name: 'G. V. R. Builders & Developers',
      phone: '+91 94401 22334',
      email: 'gvr.projects@gmail.com',
      company_name: 'GVR Constructions Pvt Ltd',
      address: 'Bypass Road, Tanuku',
      city: 'Tanuku',
      source: 'Referral',
      status: 'active'
    },
    {
      name: 'K. R. Varma',
      phone: '+91 98480 99887',
      email: 'krvarma.villa@gmail.com',
      company_name: 'Varma Vistas',
      address: 'Velpur Road, Tanuku',
      city: 'Tanuku',
      source: 'Showroom Walk-in',
      status: 'active'
    },
    {
      name: 'Dr. P. V. Rao',
      phone: '+91 99890 33445',
      email: 'pvrao.clinic@gmail.com',
      company_name: 'Rao Multispeciality Clinic',
      address: 'Near Old Bus Stand',
      city: 'Bhimavaram',
      source: 'Website',
      status: 'completed'
    }
  ]).select();

  if (clientErr) console.error('Clients error:', clientErr.message);
  else console.log(`✅ Seeded ${clientsList.length} clients!`);

  // 3. Raw Materials
  const { data: matCats } = await supabase.from('material_categories').select('*');
  const upvcCat = matCats?.find(c => c.name.includes('UPVC'))?.id;
  const glassCat = matCats?.find(c => c.name.includes('Glass'))?.id;
  const hdwCat = matCats?.find(c => c.name.includes('Hardware'))?.id;
  const csmCat = matCats?.find(c => c.name.includes('Consumables'))?.id;

  const { data: matList, error: matErr } = await supabase.from('materials').upsert([
    {
      name: 'UPVC Outer Frame Profile 60 Series (White)',
      category_id: upvcCat,
      code: 'PRF-UPVC-60W',
      current_stock: 450,
      reorder_level: 100,
      unit: 'meters',
      unit_cost: 180,
      supplier_name: 'Deceuninck India / NCL'
    },
    {
      name: '5mm Clear Float Glass Sheets (4ft x 8ft)',
      category_id: glassCat,
      code: 'GLS-5MM-CLR',
      current_stock: 65,
      reorder_level: 25,
      unit: 'sheets',
      unit_cost: 1450,
      supplier_name: 'Saint-Gobain Glass Depot'
    },
    {
      name: 'Heavy Duty Friction Stays 12-inch (SS 304)',
      category_id: hdwCat,
      code: 'HDW-FST-12',
      current_stock: 14,
      reorder_level: 30,
      unit: 'pairs',
      unit_cost: 320,
      supplier_name: 'Crest Hardware'
    },
    {
      name: 'EPDM Rubber Weatherstrip Gaskets (Black)',
      category_id: csmCat,
      code: 'CSM-EPDM-GSK',
      current_stock: 40,
      reorder_level: 100,
      unit: 'meters',
      unit_cost: 18,
      supplier_name: 'Polyseal Industries'
    }
  ], { onConflict: 'code' }).select();

  if (matErr) console.error('Materials error:', matErr.message);
  else console.log(`✅ Seeded ${matList?.length || 4} materials!`);

  // 4. Leads
  const { data: leadsList, error: leadErr } = await supabase.from('leads').insert([
    {
      name: 'K. Satyanarayana Murthy',
      phone: '+91 98492 11223',
      email: 'murthy.k@gmail.com',
      city: 'Tanuku',
      product_interest: 'UPVC 3-Track Sliding with Mosquito Mesh',
      estimated_budget: 250000,
      source: 'Website Contact Form',
      priority: 'high',
      status: 'site_visit_scheduled',
      notes: 'Site visit confirmed for Thursday 10:30 AM. Measurement team assigned.'
    },
    {
      name: 'Ramesh Babu Construction',
      phone: '+91 94405 66778',
      email: 'ramesh.builders@yahoo.com',
      city: 'Tadepalligudem',
      product_interest: 'Slim Aluminium Architectural Windows',
      estimated_budget: 800000,
      source: 'Referral',
      priority: 'urgent',
      status: 'new',
      notes: 'New commercial complex. Wants technical specs for wind load compliance.'
    },
    {
      name: 'Dr. P. V. Rao',
      phone: '+91 99890 33445',
      email: 'pvrao.clinic@gmail.com',
      city: 'Bhimavaram',
      product_interest: 'Double Glazed Acoustic UPVC Windows',
      estimated_budget: 180000,
      source: 'Website',
      priority: 'medium',
      status: 'quote_sent',
      notes: 'Sent proposal for 24mm DGU glass. Following up on Saturday.'
    }
  ]).select();

  if (leadErr) console.error('Leads error:', leadErr.message);
  else console.log(`✅ Seeded ${leadsList?.length || 3} leads!`);

  // 5. Projects
  if (clientsList && clientsList.length > 0) {
    const { data: projList, error: projErr } = await supabase.from('projects').insert([
      {
        title: 'Sri Lakshmi Grand Residency (48 Windows)',
        client_id: clientsList[0].id,
        site_location: 'Tanuku Bypass Road',
        project_type: 'Commercial / Residential',
        status: 'installation',
        contract_amount: 1850000,
        amount_received: 1200000,
        start_date: '2026-10-01',
        expected_completion: '2026-11-30',
        notes: 'Glazing & Site Installation in progress.'
      },
      {
        title: 'Luxury Duplex Villa - Mr. Varma',
        client_id: clientsList[1].id,
        site_location: 'Velpur Road, Tanuku',
        project_type: 'Villa',
        status: 'fabrication',
        contract_amount: 420000,
        amount_received: 210000,
        start_date: '2026-10-15',
        expected_completion: '2026-12-10',
        notes: 'UPVC Frame Fabrication & Reinforcement.'
      }
    ]).select();

    if (projErr) console.error('Projects error:', projErr.message);
    else console.log(`✅ Seeded ${projList?.length || 2} projects!`);
  }

  // 6. Maintenance Logs
  const { data: mntList, error: mntErr } = await supabase.from('maintenance_logs').insert([
    {
      date: '2026-11-19',
      category: 'Factory Machinery',
      location: 'Tanuku Workshop - Unit 1',
      task_description: 'Double-mitre profile cutting saw blade sharpening and calibration',
      priority: 'high',
      status: 'in_progress',
      cost: 1500
    },
    {
      date: '2026-11-18',
      category: 'Site Installation Service',
      location: 'GVR Residency Site, Tanuku',
      task_description: 'Window sash alignment check and roller lubrication for 4th-floor units',
      priority: 'normal',
      status: 'completed',
      cost: 0
    }
  ]).select();

  if (mntErr) console.error('Maintenance error:', mntErr.message);
  else console.log(`✅ Seeded ${mntList?.length || 2} maintenance logs!`);

  console.log('🎉 Supabase Seeding Completed Successfully!');
}

seed();
