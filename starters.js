// Ready-made part lists for first-time setup. Entries are "name" (counted each) or ["name", "unit"].
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
          ['1.5mm three core and earth', 'm'], ['6mm earth cable', 'm'], ['10mm earth cable', 'm'],
          ['0.75mm flex', 'm'], ['1.5mm flex', 'm'], ['2.5mm flex', 'm'], ['Cat6 data cable', 'm'],
          ['Coax cable', 'm'], ['Alarm cable', 'm'],
        ],
        'Sockets and switches': [
          '1 gang socket', '2 gang socket', 'USB socket', '1 gang 1 way switch', '1 gang 2 way switch',
          '2 gang 2 way switch', 'Intermediate switch', 'Dimmer switch', 'Pull cord switch',
          'Fused spur', 'Switched fused spur', '20A double pole switch', '45A cooker switch',
          'Blank plate', 'Outdoor socket',
        ],
        'Back boxes': [
          '1 gang 25mm back box', '1 gang 35mm back box', '2 gang 25mm back box', '2 gang 35mm back box',
          '1 gang dry lining box', '2 gang dry lining box', '1 gang surface box', '2 gang surface box',
        ],
        'Consumer units and protection': [
          '6A MCB', '10A MCB', '16A MCB', '20A MCB', '32A MCB', '40A MCB', '30mA RCBO 6A', '30mA RCBO 16A',
          '30mA RCBO 32A', '63A RCD', 'Surge protection device', 'Consumer unit blanks',
        ],
        'Lighting': [
          'Ceiling rose', 'Batten lampholder', 'LED downlight', 'Fire hood', 'LED batten',
          'LED bulb B22', 'LED bulb E27', 'LED bulb GU10',
        ],
        'Connectors': [
          'Wago 2 way connector', 'Wago 3 way connector', 'Wago 5 way connector', 'Terminal strip',
          'Junction box 20A', 'Junction box 30A', 'Crimp ring terminal', 'Crimp butt connector', 'Earth clamp',
        ],
        'Fixings and containment': [
          ['Cable clips 1.5mm', 'box'], ['Cable clips 2.5mm', 'box'], ['Cable clips 6mm', 'box'],
          ['Fire rated clips', 'box'], ['Cable ties', 'pack'], ['Wall plugs', 'box'], ['Screws', 'box'],
          ['Mini trunking', 'm'], ['Maxi trunking', 'm'], ['20mm conduit', 'm'], ['Green and yellow sleeving', 'm'],
          ['Grey sleeving', 'm'], ['Grommets', 'pack'], ['Insulation tape', 'roll'],
        ],
        'Safety devices': [
          'Smoke alarm', 'Heat alarm', 'Carbon monoxide alarm', 'Extractor fan', 'Isolator switch',
        ],
      },
    },
    {
      id: 'plumber',
      label: 'Plumber',
      categories: {
        'Pipe': [
          ['15mm copper pipe', 'm'], ['22mm copper pipe', 'm'], ['28mm copper pipe', 'm'],
          ['15mm plastic pipe', 'm'], ['22mm plastic pipe', 'm'], ['32mm waste pipe', 'm'],
          ['40mm waste pipe', 'm'], ['110mm soil pipe', 'm'], ['21.5mm overflow pipe', 'm'],
        ],
        'Copper fittings': [
          '15mm elbow', '22mm elbow', '15mm straight coupler', '22mm straight coupler', '15mm equal tee',
          '22mm equal tee', '22mm x 15mm reducer', '22mm x 15mm x 15mm tee', '15mm tap connector',
          '15mm stop end', '22mm stop end', '15mm x 1/2in male iron', '15mm x 1/2in female iron',
        ],
        'Push-fit fittings': [
          '15mm push-fit elbow', '22mm push-fit elbow', '15mm push-fit coupler', '22mm push-fit coupler',
          '15mm push-fit tee', '22mm push-fit tee', '15mm pipe insert', '22mm pipe insert',
        ],
        'Valves': [
          '15mm isolating valve', '22mm isolating valve', '15mm stop tap', '22mm stop tap', '15mm check valve',
          '22mm check valve', '15mm gate valve', '22mm gate valve', 'Float valve', 'Pressure reducing valve',
          'Outside tap', 'Washing machine valve',
        ],
        'Taps and connectors': [
          ['Flexible tap connector 300mm'], ['Flexible tap connector 500mm'], 'Tap washer 1/2in', 'Tap washer 3/4in',
          'Tap cartridge', 'Tap O-ring set', 'Shower hose', 'Shower head',
        ],
        'Toilet parts': [
          'Fill valve', 'Flush valve', 'Cistern lever', 'Close coupling kit', 'Toilet seat', 'Pan connector',
          'Pan collar', 'Cistern doughnut washer',
        ],
        'Waste': [
          '32mm bottle trap', '40mm bottle trap', '40mm P trap', 'Basin waste', 'Bath waste', 'Sink waste',
          '32mm waste elbow', '40mm waste elbow', '32mm waste coupler', '40mm waste coupler', 'Waste tee',
          '110mm soil elbow', 'Pipe clip 32mm', 'Pipe clip 40mm',
        ],
        'Consumables': [
          ['PTFE tape', 'roll'], ['Solder', 'roll'], ['Flux', 'pack'], ['Jointing compound', 'pack'],
          ['Silicone sealant'], ['Wire wool', 'pack'], ['Emery cloth', 'roll'], ['15mm pipe clips', 'pack'],
          ['22mm pipe clips', 'pack'], ['15mm pipe insulation', 'm'], ['22mm pipe insulation', 'm'],
          ['Screws', 'box'], ['Wall plugs', 'box'], ['MAP gas'],
        ],
      },
    },
    {
      id: 'heating',
      label: 'Heating engineer',
      categories: {
        'Pipe': [
          ['15mm copper pipe', 'm'], ['22mm copper pipe', 'm'], ['28mm copper pipe', 'm'],
          ['15mm plastic pipe', 'm'], ['22mm plastic pipe', 'm'], ['22mm condensate pipe', 'm'],
          ['21.5mm overflow pipe', 'm'],
        ],
        'Fittings': [
          '15mm elbow', '22mm elbow', '15mm straight coupler', '22mm straight coupler', '15mm equal tee',
          '22mm equal tee', '22mm x 15mm reducer', '15mm isolating valve', '22mm isolating valve',
          '15mm check valve', '22mm check valve', 'Gas cock 15mm', 'Gas cock 22mm', 'Filling loop',
        ],
        'Radiator parts': [
          'Thermostatic radiator valve', 'Thermostatic valve head', 'Lockshield valve', 'Radiator bleed valve',
          'Radiator tail', 'Radiator blanking plug', 'Radiator bracket', 'Radiator key', 'Radiator pipe cover',
        ],
        'Boiler parts': [
          'Central heating pump', 'Pump valve', 'Diverter valve', '2 port motorised valve', '3 port motorised valve',
          'Expansion vessel', 'Pressure relief valve', 'Pressure gauge', 'Automatic air vent', 'Magnetic filter',
          'Ignition electrode', 'Flame sensor', 'Boiler thermistor', 'Condensate trap', 'Flue terminal',
          'Flue extension', 'Flue elbow', 'Boiler seal kit',
        ],
        'Controls': [
          'Room thermostat', 'Programmable thermostat', 'Smart thermostat', 'Time clock', 'Cylinder thermostat',
          'Wiring centre', 'Immersion heater', 'Immersion thermostat',
        ],
        'Electrical': [
          ['0.75mm heat resistant flex', 'm'], ['1.5mm twin and earth', 'm'], ['2.5mm twin and earth', 'm'],
          'Fused spur', 'Wago 3 way connector', 'Wago 5 way connector', '3A fuse', '5A fuse', '13A fuse',
        ],
        'Consumables': [
          ['Inhibitor'], ['System cleaner'], ['Leak sealer'], ['PTFE tape', 'roll'], ['Gas PTFE tape', 'roll'],
          ['Solder', 'roll'], ['Flux', 'pack'], ['Jointing compound', 'pack'], ['Fibre washers', 'pack'],
          ['15mm pipe clips', 'pack'], ['22mm pipe clips', 'pack'], ['15mm pipe insulation', 'm'],
          ['22mm pipe insulation', 'm'], ['Silicone sealant'], ['Screws', 'box'], ['Wall plugs', 'box'], ['MAP gas'],
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
