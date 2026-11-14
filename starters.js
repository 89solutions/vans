// Ready-made part lists for first-time setup. Entries are "name" (counted each) or ["name", "unit"].
// Names already in use are kept as they are, so counts saved during an unfinished setup still match.
(function (global) {
  'use strict';

  const LISTS = [
    {
      id: 'electrician',
      label: 'Electrician',
      categories: {
        'Cable': [
          ['1.0mm twin and earth', 'm'], ['1.5mm twin and earth', 'm'], ['2.5mm twin and earth', 'm'],
          ['4mm twin and earth', 'm'], ['6mm twin and earth', 'm'], ['10mm twin and earth', 'm'],
          ['16mm twin and earth', 'm'], ['1.5mm three core and earth', 'm'], ['2.5mm three core and earth', 'm'],
          ['6mm earth cable', 'm'], ['10mm earth cable', 'm'], ['16mm earth cable', 'm'],
          ['16mm meter tails', 'm'], ['25mm meter tails', 'm'],
          ['2.5mm 3 core SWA', 'm'], ['4mm 3 core SWA', 'm'], ['6mm 3 core SWA', 'm'], ['10mm 3 core SWA', 'm'],
          ['1.5mm fire resistant cable', 'm'], ['2.5mm fire resistant cable', 'm'],
          ['0.75mm flex', 'm'], ['1.0mm 3 core flex', 'm'], ['1.5mm flex', 'm'], ['2.5mm flex', 'm'],
          ['0.75mm heat resistant flex', 'm'], ['1.5mm arctic flex', 'm'], ['1.5mm singles', 'm'],
          ['Cat5e data cable', 'm'], ['Cat6 data cable', 'm'], ['Coax cable', 'm'], ['Satellite cable', 'm'],
          ['Alarm cable', 'm'], ['Bell wire', 'm'],
        ],
        'Sockets and switches': [
          '1 gang socket', '2 gang socket', 'USB socket', 'Outdoor socket', 'Shaver socket',
          'Metal clad 1 gang socket', 'Metal clad 2 gang socket', 'TV coax socket', 'Satellite socket',
          'Data socket', 'Telephone socket', 'Flex outlet plate', 'Cooker connection unit',
          '1 gang 1 way switch', '1 gang 2 way switch', '2 gang 2 way switch', '3 gang 2 way switch',
          '4 gang 2 way switch', 'Intermediate switch', 'Dimmer switch', 'Metal clad switch', 'Outdoor switch',
          'Pull cord switch', 'Fan isolator switch', 'Grid switch module', 'Grid switch frame',
          'Fused spur', 'Switched fused spur', 'Unswitched fused spur', '20A double pole switch',
          '45A cooker switch', 'Blank plate',
        ],
        'Back boxes': [
          '1 gang 25mm back box', '1 gang 35mm back box', '1 gang 47mm back box',
          '2 gang 25mm back box', '2 gang 35mm back box', '2 gang 47mm back box',
          '1 gang dry lining box', '2 gang dry lining box', '1 gang surface box', '2 gang surface box',
          'Metal clad 1 gang box', 'Metal clad 2 gang box', 'Adaptable box 100mm', 'Adaptable box 150mm',
          ['Back box fixing lugs', 'pack'],
        ],
        'Consumer units and protection': [
          'Consumer unit', 'Garage consumer unit', '100A main switch', '63A RCD', '80A RCD', '100A RCD',
          '6A MCB', '10A MCB', '16A MCB', '20A MCB', '32A MCB', '40A MCB', '50A MCB', '63A MCB',
          '30mA RCBO 6A', '30mA RCBO 10A', '30mA RCBO 16A', '30mA RCBO 20A', '30mA RCBO 32A', '30mA RCBO 40A',
          'Arc fault detection device', 'Surge protection device', 'Consumer unit blanks', 'Busbar',
          'DIN rail', 'Henley block', 'Main earth terminal block', '100A isolator',
        ],
        'Lighting': [
          'Ceiling rose', 'Pendant set', 'Batten lampholder', 'Pendant lampholder B22', 'Pendant lampholder E27',
          'LED downlight', 'Fire hood', 'LED batten', 'LED bulkhead', 'LED panel 600 x 600',
          'Bathroom ceiling light', 'Under cabinet light', ['LED strip', 'm'], 'LED driver', 'Dimmable LED driver',
          'Outdoor PIR floodlight', 'PIR sensor', 'Emergency light', 'Emergency exit sign',
          'LED bulb B22', 'LED bulb E27', 'LED bulb E14', 'LED bulb B15', 'LED bulb GU10',
        ],
        'Connectors and glands': [
          'Wago 2 way connector', 'Wago 3 way connector', 'Wago 5 way connector', 'Wago inline connector',
          'Terminal strip', 'Junction box 20A', 'Junction box 30A', 'Maintenance free junction box',
          'Outdoor junction box', ['Crimp ring terminal', 'pack'], ['Crimp butt connector', 'pack'],
          ['Crimp spade terminal', 'pack'], ['Bootlace ferrules', 'pack'], 'Earth clamp',
          '20mm SWA gland', '25mm SWA gland', 'SWA gland shroud', 'Banjo earth tag', '20mm locknut',
          '20mm brass bush', '20mm cable gland',
        ],
        'Fixings and containment': [
          ['Cable clips 1.0mm', 'box'], ['Cable clips 1.5mm', 'box'], ['Cable clips 2.5mm', 'box'],
          ['Cable clips 4mm', 'box'], ['Cable clips 6mm', 'box'], ['Cable clips 10mm', 'box'],
          ['Round cable clips', 'box'], ['Fire rated clips', 'box'], ['Cable ties', 'pack'],
          ['Wall plugs', 'box'], ['Screws', 'box'], ['Plasterboard fixings', 'box'], ['Spring toggles', 'box'],
          ['Frame fixings', 'box'], ['Mini trunking', 'm'], ['Maxi trunking', 'm'], ['Dado trunking', 'm'],
          'Mini trunking bend', 'Mini trunking tee', ['20mm conduit', 'm'], ['25mm conduit', 'm'],
          ['20mm flexible conduit', 'm'], '20mm conduit bend', '20mm conduit coupler', '20mm saddle clip',
          '20mm conduit through box', ['Green and yellow sleeving', 'm'], ['Grey sleeving', 'm'],
          ['Brown sleeving', 'm'], ['Heat shrink sleeving', 'pack'], ['Grommets', 'pack'],
          ['Insulation tape', 'roll'], ['Self-amalgamating tape', 'roll'],
        ],
        'Safety devices': [
          'Smoke alarm', 'Heat alarm', 'Carbon monoxide alarm', 'Radio interlink module', 'Extractor fan',
          'Inline extractor fan', 'Isolator switch', 'Rotary isolator', 'Immersion heater switch', 'Doorbell kit',
        ],
        'Fuses and plugs': [
          '13A plug', '3A plug fuse', '5A plug fuse', '13A plug fuse', 'Rewireable fuse wire',
        ],
        'Labels and consumables': [
          ['Earth warning labels', 'pack'], ['RCD test labels', 'pack'], ['Periodic inspection labels', 'pack'],
          ['Dual supply labels', 'pack'], ['Cable markers', 'pack'], ['Fire stopping foam'],
          ['Intumescent sealant'], ['Silicone sealant'], ['Batteries AA', 'pack'], ['Batteries AAA', 'pack'],
          ['Batteries 9V', 'pack'], ['Duct tape', 'roll'], ['Dust sheet'], ['Blue roll', 'roll'],
        ],
      },
    },
    {
      id: 'plumber',
      label: 'Plumber',
      categories: {
        'Pipe': [
          ['10mm copper pipe', 'm'], ['15mm copper pipe', 'm'], ['22mm copper pipe', 'm'],
          ['28mm copper pipe', 'm'], ['15mm chrome pipe', 'm'], ['10mm plastic pipe', 'm'],
          ['15mm plastic pipe', 'm'], ['22mm plastic pipe', 'm'], ['28mm plastic pipe', 'm'],
          ['20mm MDPE pipe', 'm'], ['25mm MDPE pipe', 'm'], ['32mm waste pipe', 'm'], ['40mm waste pipe', 'm'],
          ['50mm waste pipe', 'm'], ['110mm soil pipe', 'm'], ['21.5mm overflow pipe', 'm'], ['68mm downpipe', 'm'],
        ],
        'Copper fittings': [
          '15mm elbow', '22mm elbow', '28mm elbow', '15mm street elbow', '22mm street elbow',
          '15mm obtuse elbow', '22mm obtuse elbow', '15mm straight coupler', '22mm straight coupler',
          '28mm straight coupler', '15mm equal tee', '22mm equal tee', '28mm equal tee',
          '22mm x 15mm reducer', '28mm x 22mm reducer', '15mm x 10mm reducer', '22mm x 15mm x 15mm tee',
          '22mm x 22mm x 15mm tee', '15mm tap connector', '22mm tap connector', '15mm stop end', '22mm stop end',
          '15mm wall plate elbow', '15mm x 1/2in male iron', '15mm x 1/2in female iron', '22mm x 3/4in male iron',
          '22mm x 3/4in female iron', '15mm tank connector', '22mm tank connector',
        ],
        'Compression fittings': [
          '15mm compression elbow', '22mm compression elbow', '15mm compression coupler',
          '22mm compression coupler', '15mm compression tee', '22mm compression tee',
          '15mm compression stop end', '22mm compression stop end', ['15mm olives', 'pack'],
          ['22mm olives', 'pack'], '15mm compression nut', '22mm compression nut',
        ],
        'Push-fit fittings': [
          '15mm push-fit elbow', '22mm push-fit elbow', '28mm push-fit elbow', '15mm push-fit coupler',
          '22mm push-fit coupler', '15mm push-fit tee', '22mm push-fit tee', '22mm x 15mm x 15mm push-fit tee',
          '22mm x 15mm push-fit reducer', '15mm push-fit stop end', '22mm push-fit stop end',
          '15mm push-fit tap connector', '15mm pipe insert', '22mm pipe insert', ['Demount clips', 'pack'],
        ],
        'Valves': [
          '15mm isolating valve', '22mm isolating valve', '15mm stop tap', '22mm stop tap', '15mm check valve',
          '22mm check valve', '15mm double check valve', '15mm gate valve', '22mm gate valve', '28mm gate valve',
          '15mm lever ball valve', '22mm lever ball valve', 'Drain off cock', 'Float valve', 'Float valve washer',
          'Pressure reducing valve', 'Thermostatic mixing valve', 'Outside tap', 'Washing machine valve',
          'MDPE to copper adaptor',
        ],
        'Taps and showers': [
          ['Flexible tap connector 300mm'], ['Flexible tap connector 500mm'], 'Tap washer 1/2in', 'Tap washer 3/4in',
          'Ceramic disc cartridge 1/2in', 'Ceramic disc cartridge 3/4in', 'Tap cartridge', 'Tap O-ring set',
          'Basin mixer tap', 'Kitchen mixer tap', 'Bath mixer tap', 'Shower hose', 'Shower head',
          'Shower riser rail', 'Shower valve cartridge', 'Thermostatic shower valve',
        ],
        'Toilet parts': [
          'Fill valve', 'Bottom entry fill valve', 'Side entry fill valve', 'Flush valve', 'Push button flush valve',
          'Flush button', 'Siphon', 'Siphon diaphragm', 'Cistern lever', 'Close coupling kit',
          'Cistern doughnut washer', 'Cistern fixing bolts', 'Toilet seat', 'Toilet seat fixings',
          'Pan connector', 'Offset pan connector', 'Pan collar', 'Pan fixing kit',
        ],
        'Waste': [
          '32mm bottle trap', '40mm bottle trap', '40mm P trap', 'Bath trap', 'Shower trap', 'Washing machine trap',
          'Anti-siphon trap', 'Waterless trap valve', 'Basin waste', 'Bath waste', 'Sink waste', 'Click clack waste',
          'Dishwasher spigot', '32mm waste elbow', '40mm waste elbow', '32mm waste coupler', '40mm waste coupler',
          'Waste tee', '40mm x 32mm waste reducer', 'Strap boss', 'Air admittance valve', '110mm soil elbow',
          '110mm soil coupler', '110mm soil branch', 'Pipe clip 32mm', 'Pipe clip 40mm', 'Pipe clip 110mm',
        ],
        'Hot water': [
          'Immersion heater', 'Immersion heater thermostat', 'Cylinder jacket', 'Unvented expansion vessel',
          'Temperature and pressure relief valve', '15mm tundish', 'Scale reducer',
        ],
        'Consumables': [
          ['PTFE tape', 'roll'], ['Solder', 'roll'], ['Flux', 'pack'], ['Jointing compound', 'pack'], ['Hemp', 'pack'],
          ['Silicone sealant'], ['Silicone grease'], ['Solvent cement'], ['Sealing putty'], ['Pipe freezing spray'],
          ['Leak detection spray'], ['Wire wool', 'pack'], ['Emery cloth', 'roll'], ['15mm pipe clips', 'pack'],
          ['22mm pipe clips', 'pack'], ['15mm pipe insulation', 'm'], ['22mm pipe insulation', 'm'],
          ['Screws', 'box'], ['Wall plugs', 'box'], ['Plasterboard fixings', 'box'], ['Frame fixings', 'box'],
          ['Hacksaw blades', 'pack'], ['Pipe cutter wheels', 'pack'], ['Duct tape', 'roll'], ['Cable ties', 'pack'],
          ['Blue roll', 'roll'], ['Dust sheet'], ['MAP gas'],
        ],
      },
    },
    {
      id: 'heating',
      label: 'Heating engineer',
      categories: {
        'Pipe': [
          ['8mm microbore pipe', 'm'], ['10mm copper pipe', 'm'], ['15mm copper pipe', 'm'],
          ['22mm copper pipe', 'm'], ['28mm copper pipe', 'm'], ['10mm plastic pipe', 'm'],
          ['15mm plastic pipe', 'm'], ['22mm plastic pipe', 'm'], ['22mm condensate pipe', 'm'],
          ['32mm condensate pipe', 'm'], ['21.5mm overflow pipe', 'm'],
        ],
        'Fittings': [
          '8mm elbow', '10mm elbow', '15mm elbow', '22mm elbow', '28mm elbow', '15mm straight coupler',
          '22mm straight coupler', '28mm straight coupler', '15mm equal tee', '22mm equal tee', '28mm equal tee',
          '22mm x 15mm reducer', '15mm x 10mm reducer', '28mm x 22mm reducer', '15mm stop end', '22mm stop end',
          '15mm x 1/2in male iron', '22mm x 3/4in male iron', '15mm compression elbow', '22mm compression elbow',
          '15mm compression coupler', '22mm compression coupler', '15mm compression tee', '22mm compression tee',
          ['15mm olives', 'pack'], ['22mm olives', 'pack'], '15mm push-fit elbow', '22mm push-fit elbow',
          '15mm isolating valve', '22mm isolating valve', '15mm check valve', '22mm check valve',
          '15mm drain off cock', '22mm drain off cock', 'Automatic bypass valve', 'Filling loop',
          '21.5mm condensate elbow', '21.5mm condensate coupler',
        ],
        'Radiator parts': [
          'Thermostatic radiator valve', 'Thermostatic valve head', 'Lockshield valve', 'Radiator valve pair',
          'Towel rail valve pair', 'Radiator bleed valve', 'Radiator tail', 'Radiator tail extension',
          'Microbore radiator valve adaptor', 'Radiator blanking plug', 'Radiator bracket', 'Radiator key',
          'Radiator pipe cover',
        ],
        'Boiler parts': [
          'Central heating pump', 'Pump valve', 'Diverter valve', 'Diverter valve cartridge',
          '2 port motorised valve', '3 port motorised valve', 'Motorised valve actuator head', 'Expansion vessel',
          'Pressure relief valve', 'Pressure gauge', 'Water pressure sensor', 'Automatic air vent',
          'Magnetic filter', 'Plate heat exchanger', 'Flow switch', 'Air pressure switch', 'Overheat thermostat',
          'Boiler fan', 'Gas valve', 'Igniter', 'Ignition electrode', 'Ignition lead', 'Flame sensor',
          'Boiler thermistor', 'Burner gasket', 'Combustion chamber gasket', 'Condensate trap', 'Condensate pump',
          'Boiler fuse', 'Boiler seal kit',
        ],
        'Flue': [
          'Flue terminal', 'Flue extension', 'Flue elbow', '45 degree flue elbow', 'Flue clamp',
          'Flue support bracket', 'Flue sealing collar', 'Plume management kit',
        ],
        'Controls': [
          'Room thermostat', 'Wireless room thermostat', 'Programmable thermostat', 'Smart thermostat',
          'Smart radiator valve head', 'Receiver unit', 'Time clock', 'Two channel programmer',
          'Cylinder thermostat', 'Frost thermostat', 'Pipe thermostat', 'Outdoor weather sensor', 'Wiring centre',
          'Immersion heater', 'Immersion thermostat',
        ],
        'Gas': [
          'Gas cock 15mm', 'Gas cock 22mm', 'Emergency control valve', 'Meter flexi', 'Gas bayonet fitting',
          'Gas cooker hose', 'Gas test point', 'Gas pipe sleeve', ['Gas warning labels', 'pack'],
          ['Pipe identification tape', 'roll'], ['Leak detection fluid'],
        ],
        'Electrical': [
          ['0.75mm heat resistant flex', 'm'], ['1.5mm twin and earth', 'm'], ['2.5mm twin and earth', 'm'],
          ['1.5mm three core and earth', 'm'], ['1.5mm 4 core flex', 'm'], 'Fused spur', 'Junction box 20A',
          'Wago 2 way connector', 'Wago 3 way connector', 'Wago 5 way connector', '3A fuse', '5A fuse', '13A fuse',
          'Earth clamp', ['Cable clips 1.5mm', 'box'], ['Cable ties', 'pack'], ['Insulation tape', 'roll'],
        ],
        'Consumables': [
          ['Inhibitor'], ['System cleaner'], ['Leak sealer'], ['Inhibitor test kit'], ['PTFE tape', 'roll'],
          ['Gas PTFE tape', 'roll'], ['Solder', 'roll'], ['Flux', 'pack'], ['Jointing compound', 'pack'],
          ['Fibre washers', 'pack'], ['Rubber washers', 'pack'], ['O-ring kit'], ['Silicone grease'],
          ['Heat resistant silicone'], ['Fire cement'], ['Flue sealing tape', 'roll'], ['Pipe freezing spray'],
          ['15mm pipe clips', 'pack'], ['22mm pipe clips', 'pack'], ['15mm pipe insulation', 'm'],
          ['22mm pipe insulation', 'm'], ['Silicone sealant'], ['Screws', 'box'], ['Wall plugs', 'box'],
          ['Plasterboard fixings', 'box'], ['Hacksaw blades', 'pack'], ['Batteries AA', 'pack'],
          ['Batteries AAA', 'pack'], ['Duct tape', 'roll'], ['Blue roll', 'roll'], ['Dust sheet'], ['MAP gas'],
        ],
      },
    },
  ];

  global.VanStarters = LISTS.map((list) => ({
    id: list.id,
    label: list.label,
    categories: Object.entries(list.categories).map(([category, parts]) => ({
      name: category,
      parts: parts.map((part) => {
        const [name, unit] = Array.isArray(part) ? part : [part];
        return { name: name, unit: unit || 'each', category: category };
      }),
    })),
  }));
})(window);
