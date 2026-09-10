import { getSql, ensureDb } from './serverDb';

export type RollCallStatus = 'PRESENT' | 'PRESENT_AND_VOTING' | 'ABSENT';

export interface CommitteeCountry {
  id: string;
  name: string;
  flag?: string;
  status: RollCallStatus;
  assignedDelegate?: string;
  p5?: boolean;
  bloc?: string;
  notes?: string;
}

export interface CommitteeItem {
  id: string;
  code: string;
  name: string;
  topic: string;
  category: string;
  description?: string;
  chairName?: string;
  countries: CommitteeCountry[];
  createdAt: number;
  updatedAt: number;
}

export const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'China': '🇨🇳',
  "People's Republic of China": '🇨🇳',
  'Russian Federation': '🇷🇺',
  'Russia': '🇷🇺',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Germany': '🇩🇪',
  'Japan': '🇯🇵',
  'South Africa': '🇿🇦',
  'Australia': '🇦🇺',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Saudi Arabia': '🇸🇦',
  'Pakistan': '🇵🇰',
  'Indonesia': '🇮🇩',
  'Argentina': '🇦🇷',
  'Republic of Korea': '🇰🇷',
  'South Korea': '🇰🇷',
  'Italy': '🇮🇹',
  'Turkey': '🇹🇷',
  'Türkiye': '🇹🇷',
  'Ukraine': '🇺🇦',
  'Sweden': '🇸🇪',
  'Spain': '🇪🇸',
  'Switzerland': '🇨🇭',
  'Malta': '🇲🇹',
  'Mozambique': '🇲🇿',
  'Ecuador': '🇪🇨',
  'Guyana': '🇬🇾',
  'Algeria': '🇩🇿',
  'Sierra Leone': '🇸🇱',
  'Slovenia': '🇸🇮',
  'Morocco': '🇲🇦',
  'Chile': '🇨🇱',
  'Netherlands': '🇳🇱',
  'Bangladesh': '🇧🇩',
  'Ghana': '🇬🇭',
  'Finland': '🇫🇮',
  'Costa Rica': '🇨🇷',
  'Kenya': '🇰🇪',
  'Israel': '🇮🇱',
  'Iran': '🇮🇷',
  'Norway': '🇳🇴',
  'Poland': '🇵🇱',
  'Colombia': '🇨🇴',
  'Rwanda': '🇷🇼',
  'Philippines': '🇵🇭',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'New Zealand': '🇳🇿',
  'Ireland': '🇮🇪',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Denmark': '🇩🇰',
  'Czech Republic': '🇨🇿',
  'European Union': '🇪🇺',
  'Ethiopia': '🇪🇹',
  'Senegal': '🇸🇳',
  'Angola': '🇦🇴',
  'Uganda': '🇺🇬',
  'Tanzania': '🇹🇿',
  'Cuba': '🇨🇺',
  'Venezuela': '🇻🇪',
  'Peru': '🇵🇪',
  'Qatar': '🇶🇦',
  'United Arab Emirates': '🇦🇪',
  'Kuwait': '🇰🇼',
};

export function getCountryFlag(name: string): string {
  if (!name) return '🌐';
  const clean = name.trim();
  if (COUNTRY_FLAGS[clean]) return COUNTRY_FLAGS[clean];
  const lower = clean.toLowerCase();
  for (const [k, v] of Object.entries(COUNTRY_FLAGS)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
      return v;
    }
  }
  return '🌐';
}

export const PRESET_MATRICES: Record<string, { label: string; countries: string[] }> = {
  G20: {
    label: 'G20 Major Economies (20 delegations)',
    countries: [
      'United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'Italy', 'Canada',
      'China', 'Russian Federation', 'India', 'Brazil', 'South Africa', 'Australia',
      'Saudi Arabia', 'Republic of Korea', 'Indonesia', 'Turkey', 'Argentina', 'Mexico', 'European Union'
    ],
  },
  UNSC_15: {
    label: 'UN Security Council (P5 + E10)',
    countries: [
      'United States', 'United Kingdom', 'France', 'People\'s Republic of China', 'Russian Federation',
      'Japan', 'Switzerland', 'Malta', 'Mozambique', 'Ecuador', 'Guyana', 'Algeria',
      'Sierra Leone', 'Slovenia', 'Republic of Korea'
    ],
  },
  UNGA_CORE_30: {
    label: 'Core UNGA Representative States (30 nations)',
    countries: [
      'United States', 'United Kingdom', 'France', 'China', 'Russian Federation',
      'India', 'Brazil', 'Germany', 'Japan', 'South Africa', 'Australia', 'Canada',
      'Mexico', 'Egypt', 'Nigeria', 'Saudi Arabia', 'Pakistan', 'Indonesia', 'Argentina',
      'Republic of Korea', 'Italy', 'Turkey', 'Ukraine', 'Sweden', 'Spain',
      'Norway', 'Poland', 'Kenya', 'Colombia', 'Morocco'
    ],
  },
  ASEAN_10: {
    label: 'ASEAN Bloc (10 Southeast Asian nations)',
    countries: [
      'Indonesia', 'Malaysia', 'Philippines', 'Singapore', 'Thailand',
      'Vietnam', 'Brunei', 'Cambodia', 'Laos', 'Myanmar'
    ],
  },
  EU_KEY: {
    label: 'European Union Major Delegations (15 nations)',
    countries: [
      'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden',
      'Belgium', 'Austria', 'Ireland', 'Portugal', 'Greece', 'Finland', 'Denmark', 'Czech Republic'
    ],
  },
  AU_KEY: {
    label: 'African Union Major Delegations (14 nations)',
    countries: [
      'South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ethiopia', 'Ghana', 'Morocco',
      'Algeria', 'Senegal', 'Rwanda', 'Angola', 'Tanzania', 'Uganda', 'Cote d\'Ivoire'
    ],
  },
};

const makeCountry = (
  name: string,
  status: RollCallStatus = 'PRESENT',
  p5 = false,
  bloc = 'General'
): CommitteeCountry => ({
  id: `cty_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}_${Math.random().toString(36).slice(2, 6)}`,
  name,
  flag: getCountryFlag(name),
  status,
  p5,
  bloc,
});

export const initialSeedCommittees: CommitteeItem[] = [
  {
    id: 'unga',
    code: 'UNGA',
    name: 'United Nations General Assembly Plenary',
    topic: 'Global Food Security, Supply Chain Resilience and Agricultural Trade Subsidies',
    category: 'General Assembly',
    chairName: 'President of the General Assembly',
    description: 'The main deliberative, policymaking and representative organ of the United Nations comprising all 193 Member States.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('United States', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('United Kingdom', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('France', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('China', 'PRESENT_AND_VOTING', true, 'Asia-Pacific'),
      makeCountry('Russian Federation', 'PRESENT_AND_VOTING', true, 'Eastern Europe'),
      makeCountry('India', 'PRESENT_AND_VOTING', false, 'Asia-Pacific / BRICS'),
      makeCountry('Brazil', 'PRESENT', false, 'GRULAC / BRICS'),
      makeCountry('Germany', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Japan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('South Africa', 'PRESENT', false, 'African Group / BRICS'),
      makeCountry('Australia', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Canada', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Mexico', 'PRESENT', false, 'GRULAC'),
      makeCountry('Egypt', 'PRESENT', false, 'African Group / Arab League'),
      makeCountry('Nigeria', 'PRESENT', false, 'African Group'),
      makeCountry('Saudi Arabia', 'PRESENT', false, 'Asia-Pacific / Arab League'),
      makeCountry('Pakistan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Indonesia', 'PRESENT', false, 'Asia-Pacific / ASEAN'),
      makeCountry('Argentina', 'PRESENT', false, 'GRULAC'),
      makeCountry('Republic of Korea', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Italy', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Turkey', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Ukraine', 'PRESENT', false, 'Eastern Europe'),
      makeCountry('Sweden', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Spain', 'PRESENT', false, 'Western Bloc'),
    ],
  },
  {
    id: 'unsc',
    code: 'UNSC',
    name: 'United Nations Security Council',
    topic: 'Maintenance of International Peace & Security: De-escalating Nuclear Posturing',
    category: 'Security & Disarmament',
    chairName: 'President Sarah Jenkins',
    description: 'Primary responsibility under the UN Charter for the maintenance of international peace and security.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('United States', 'PRESENT_AND_VOTING', true, 'P5 Permanent Member'),
      makeCountry('United Kingdom', 'PRESENT_AND_VOTING', true, 'P5 Permanent Member'),
      makeCountry('France', 'PRESENT_AND_VOTING', true, 'P5 Permanent Member'),
      makeCountry("People's Republic of China", 'PRESENT_AND_VOTING', true, 'P5 Permanent Member'),
      makeCountry('Russian Federation', 'PRESENT_AND_VOTING', true, 'P5 Permanent Member'),
      makeCountry('Japan', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Switzerland', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Malta', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Mozambique', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Ecuador', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Guyana', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Algeria', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Sierra Leone', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Slovenia', 'PRESENT', false, 'E10 Elected Member'),
      makeCountry('Republic of Korea', 'PRESENT', false, 'E10 Elected Member'),
    ],
  },
  {
    id: 'unhrc',
    code: 'UNHRC',
    name: 'United Nations Human Rights Council',
    topic: 'Protection of Human Rights Defenders, Press Freedoms and Prevention of Arbitrary Detention',
    category: 'Human Rights & Social',
    chairName: 'UNHRC Vice-President',
    description: 'Responsible for strengthening the promotion and protection of human rights around the globe.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('Germany', 'PRESENT', false, 'Western Group'),
      makeCountry('France', 'PRESENT', false, 'Western Group'),
      makeCountry('United States', 'PRESENT_AND_VOTING', false, 'Western Group'),
      makeCountry('Argentina', 'PRESENT', false, 'GRULAC'),
      makeCountry('South Africa', 'PRESENT', false, 'African Group'),
      makeCountry('Japan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('India', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Brazil', 'PRESENT', false, 'GRULAC'),
      makeCountry('Morocco', 'PRESENT', false, 'African Group'),
      makeCountry('Chile', 'PRESENT', false, 'GRULAC'),
      makeCountry('Netherlands', 'PRESENT', false, 'Western Group'),
      makeCountry('Mexico', 'PRESENT', false, 'GRULAC'),
      makeCountry('Bangladesh', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Ghana', 'PRESENT', false, 'African Group'),
      makeCountry('Indonesia', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Finland', 'PRESENT', false, 'Western Group'),
      makeCountry('Costa Rica', 'PRESENT', false, 'GRULAC'),
      makeCountry('Kenya', 'PRESENT', false, 'African Group'),
    ],
  },
  {
    id: 'disec',
    code: 'DISEC',
    name: 'UNGA First Committee (Disarmament & International Security)',
    topic: 'Addressing the Proliferation of Lethal Autonomous Weapons Systems (LAWS) and Cyber Warfare',
    category: 'Security & Disarmament',
    chairName: 'DISEC Dais Board',
    description: 'Deals with disarmament, global challenges and threats to peace that affect the international community.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('United States', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('China', 'PRESENT_AND_VOTING', true, 'Asia-Pacific'),
      makeCountry('Russian Federation', 'PRESENT_AND_VOTING', true, 'Eastern Europe'),
      makeCountry('United Kingdom', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('France', 'PRESENT_AND_VOTING', true, 'Western Bloc'),
      makeCountry('Germany', 'PRESENT', false, 'Western Bloc'),
      makeCountry('India', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Pakistan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Israel', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Iran', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Japan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Republic of Korea', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Brazil', 'PRESENT', false, 'GRULAC'),
      makeCountry('Egypt', 'PRESENT', false, 'African Group'),
      makeCountry('Australia', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Sweden', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Norway', 'PRESENT', false, 'Western Bloc'),
      makeCountry('Poland', 'PRESENT', false, 'Eastern Europe'),
    ],
  },
  {
    id: 'unep',
    code: 'UNEP',
    name: 'United Nations Environment Programme',
    topic: 'International Legally Binding Instrument on Plastic Pollution and Marine Ecosystem Restoration',
    category: 'Economic & Specialized',
    chairName: 'UNEP Executive Secretariat',
    description: 'The leading global environmental authority that sets the global environmental agenda.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('Kenya', 'PRESENT', false, 'Host Nation / African Group'),
      makeCountry('France', 'PRESENT', false, 'Western Group'),
      makeCountry('Canada', 'PRESENT', false, 'Western Group'),
      makeCountry('Colombia', 'PRESENT', false, 'GRULAC'),
      makeCountry('Rwanda', 'PRESENT', false, 'African Group'),
      makeCountry('Norway', 'PRESENT', false, 'Western Group'),
      makeCountry('Japan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Brazil', 'PRESENT', false, 'GRULAC'),
      makeCountry('India', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Germany', 'PRESENT', false, 'Western Group'),
      makeCountry('Indonesia', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Philippines', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('South Africa', 'PRESENT', false, 'African Group'),
      makeCountry('Egypt', 'PRESENT', false, 'African Group'),
      makeCountry('Australia', 'PRESENT', false, 'Western Group'),
      makeCountry('Chile', 'PRESENT', false, 'GRULAC'),
    ],
  },
  {
    id: 'who',
    code: 'WHO',
    name: 'World Health Organization (World Health Assembly)',
    topic: 'Strengthening Global Health Emergency Architecture and Equitable Medical Access',
    category: 'Economic & Specialized',
    chairName: 'Director-General Executive Office',
    description: 'Directs and coordinates international health work across the United Nations system.',
    createdAt: 1741250000000,
    updatedAt: 1741250000000,
    countries: [
      makeCountry('Switzerland', 'PRESENT', false, 'Host Nation / Western Group'),
      makeCountry('United States', 'PRESENT', false, 'Western Group'),
      makeCountry('Germany', 'PRESENT', false, 'Western Group'),
      makeCountry('India', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('South Africa', 'PRESENT', false, 'African Group'),
      makeCountry('Brazil', 'PRESENT', false, 'GRULAC'),
      makeCountry('United Kingdom', 'PRESENT', false, 'Western Group'),
      makeCountry('China', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Japan', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Nigeria', 'PRESENT', false, 'African Group'),
      makeCountry('Thailand', 'PRESENT', false, 'Asia-Pacific'),
      makeCountry('Mexico', 'PRESENT', false, 'GRULAC'),
      makeCountry('Sweden', 'PRESENT', false, 'Western Group'),
      makeCountry('Argentina', 'PRESENT', false, 'GRULAC'),
      makeCountry('Egypt', 'PRESENT', false, 'African Group'),
      makeCountry('Vietnam', 'PRESENT', false, 'Asia-Pacific'),
    ],
  },
];

// In-Memory fallback store
const memCommittees = new Map<string, CommitteeItem>();

// Seed initial memory
initialSeedCommittees.forEach((c) => {
  memCommittees.set(c.id, JSON.parse(JSON.stringify(c)));
});

let tableEnsured = false;

export async function ensureCommitteesTable(): Promise<void> {
  if (tableEnsured) return;
  const sql = getSql();
  if (!sql) {
    tableEnsured = true;
    return;
  }

  await ensureDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS mun_committees (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        topic TEXT,
        description TEXT,
        chair_name TEXT,
        category TEXT,
        countries JSONB DEFAULT '[]'::jsonb,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `;

    const countRes = await sql`SELECT count(*) as cnt FROM mun_committees;`;
    const count = Number(countRes[0]?.cnt || 0);

    if (count === 0) {
      console.log('🌱 [Database] Seeding initial MUN Committees into Neon Postgres...');
      for (const cmte of initialSeedCommittees) {
        await sql`
          INSERT INTO mun_committees (id, code, name, topic, description, chair_name, category, countries, created_at, updated_at)
          VALUES (
            ${cmte.id},
            ${cmte.code},
            ${cmte.name},
            ${cmte.topic},
            ${cmte.description || ''},
            ${cmte.chairName || ''},
            ${cmte.category || 'General Assembly'},
            ${JSON.stringify(cmte.countries)}::jsonb,
            ${cmte.createdAt},
            ${cmte.updatedAt}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
    tableEnsured = true;
  } catch (err) {
    console.error('⚠️ [Database] Committees table initialization error:', err);
    tableEnsured = true;
  }
}

// Get all committees
export async function getAllCommittees(): Promise<CommitteeItem[]> {
  await ensureCommitteesTable();
  const sql = getSql();

  if (!sql) {
    return Array.from(memCommittees.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  try {
    const rows = await sql`
      SELECT id, code, name, topic, description, chair_name as "chairName", category, countries, created_at as "createdAt", updated_at as "updatedAt"
      FROM mun_committees
      ORDER BY code ASC;
    `;

    if (rows.length === 0) {
      return Array.from(memCommittees.values()).sort((a, b) => a.code.localeCompare(b.code));
    }

    return rows.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      topic: r.topic || '',
      description: r.description || '',
      chairName: r.chairName || '',
      category: r.category || 'General Assembly',
      countries: Array.isArray(r.countries) ? r.countries : (typeof r.countries === 'string' ? JSON.parse(r.countries) : []),
      createdAt: Number(r.createdAt || Date.now()),
      updatedAt: Number(r.updatedAt || Date.now()),
    }));
  } catch (err) {
    console.error('Error fetching committees from Neon:', err);
    return Array.from(memCommittees.values()).sort((a, b) => a.code.localeCompare(b.code));
  }
}

// Get single committee by ID or Code
export async function getCommitteeById(idOrCode: string): Promise<CommitteeItem | null> {
  const clean = idOrCode.toLowerCase().trim();
  const all = await getAllCommittees();
  return all.find((c) => c.id.toLowerCase() === clean || c.code.toLowerCase() === clean) || null;
}

// Save or Update Committee
export async function saveCommittee(item: CommitteeItem): Promise<CommitteeItem> {
  item.updatedAt = Date.now();
  memCommittees.set(item.id, JSON.parse(JSON.stringify(item)));

  const sql = getSql();
  if (!sql) return item;

  await ensureCommitteesTable();
  try {
    await sql`
      INSERT INTO mun_committees (id, code, name, topic, description, chair_name, category, countries, created_at, updated_at)
      VALUES (
        ${item.id},
        ${item.code},
        ${item.name},
        ${item.topic || ''},
        ${item.description || ''},
        ${item.chairName || ''},
        ${item.category || 'General Assembly'},
        ${JSON.stringify(item.countries)}::jsonb,
        ${item.createdAt},
        ${item.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        topic = EXCLUDED.topic,
        description = EXCLUDED.description,
        chair_name = EXCLUDED.chair_name,
        category = EXCLUDED.category,
        countries = EXCLUDED.countries,
        updated_at = EXCLUDED.updated_at;
    `;
  } catch (err) {
    console.error('Error saving committee to Neon:', err);
  }

  return item;
}

// Delete committee
export async function deleteCommitteeById(id: string): Promise<boolean> {
  const cleanId = (id || '').toLowerCase().trim();
  if (!cleanId) return false;

  for (const key of Array.from(memCommittees.keys())) {
    const item = memCommittees.get(key);
    if (
      key.toLowerCase() === cleanId ||
      item?.id.toLowerCase() === cleanId ||
      item?.code.toLowerCase() === cleanId
    ) {
      memCommittees.delete(key);
    }
  }

  const sql = getSql();
  if (!sql) return true;

  await ensureCommitteesTable();
  try {
    await sql`DELETE FROM mun_committees WHERE LOWER(id) = ${cleanId} OR LOWER(code) = ${cleanId};`;
    return true;
  } catch (err) {
    console.error('Error deleting committee from Neon:', err);
    return false;
  }
}

// Bulk delete committees
export async function deleteMultipleCommittees(ids: string[]): Promise<boolean> {
  if (!Array.isArray(ids) || ids.length === 0) return true;
  for (const id of ids) {
    await deleteCommitteeById(id);
  }
  return true;
}

// Add Multiple or Single Countries to Committee
export async function addCountriesToCommittee(
  committeeId: string,
  newCountries: Array<{ name: string; status?: RollCallStatus; p5?: boolean; bloc?: string; assignedDelegate?: string; notes?: string }>
): Promise<CommitteeItem | null> {
  const committee = await getCommitteeById(committeeId);
  if (!committee) return null;

  const existingNames = new Set(committee.countries.map((c) => c.name.toLowerCase().trim()));

  for (const item of newCountries) {
    const cleanName = (item.name || '').trim();
    if (!cleanName || existingNames.has(cleanName.toLowerCase())) continue;

    const newCountry: CommitteeCountry = {
      id: `cty_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      flag: getCountryFlag(cleanName),
      status: item.status || 'PRESENT',
      p5: item.p5 ?? false,
      bloc: item.bloc || 'General Member State',
      assignedDelegate: item.assignedDelegate || undefined,
      notes: item.notes || undefined,
    };

    committee.countries.push(newCountry);
    existingNames.add(cleanName.toLowerCase());
  }

  return await saveCommittee(committee);
}

// Update single country in a committee
export async function updateCountryInCommittee(
  committeeId: string,
  countryId: string,
  updates: Partial<CommitteeCountry>
): Promise<CommitteeItem | null> {
  const committee = await getCommitteeById(committeeId);
  if (!committee) return null;

  const index = committee.countries.findIndex((c) => c.id === countryId || c.name.toLowerCase() === countryId.toLowerCase());
  if (index === -1) return null;

  const current = committee.countries[index];
  committee.countries[index] = {
    ...current,
    ...updates,
    flag: updates.name ? getCountryFlag(updates.name) : current.flag,
  };

  return await saveCommittee(committee);
}

// Delete single country from committee
export async function deleteCountryFromCommittee(
  committeeId: string,
  countryId: string
): Promise<CommitteeItem | null> {
  const committee = await getCommitteeById(committeeId);
  if (!committee) return null;

  committee.countries = committee.countries.filter((c) => c.id !== countryId && c.name.toLowerCase() !== countryId.toLowerCase());
  return await saveCommittee(committee);
}

// Batch Roll Call Update for a committee
export async function batchUpdateRollCall(
  committeeId: string,
  action: 'MARK_ALL_PRESENT' | 'MARK_ALL_PRESENT_AND_VOTING' | 'RESET'
): Promise<CommitteeItem | null> {
  const committee = await getCommitteeById(committeeId);
  if (!committee) return null;

  committee.countries = committee.countries.map((c) => {
    if (action === 'MARK_ALL_PRESENT') {
      return { ...c, status: 'PRESENT' as RollCallStatus };
    }
    if (action === 'MARK_ALL_PRESENT_AND_VOTING') {
      return { ...c, status: 'PRESENT_AND_VOTING' as RollCallStatus };
    }
    if (action === 'RESET') {
      return { ...c, status: 'ABSENT' as RollCallStatus };
    }
    return c;
  });

  return await saveCommittee(committee);
}

// Synchronize delegate assignment with committee country roster
export async function syncDelegateAssignment(
  delegateName: string,
  committeeIdOrCodeOrName: string,
  countryName: string
): Promise<CommitteeItem | null> {
  if (!delegateName) return null;
  const cleanDelegate = delegateName.trim();
  const cleanTargetCommittee = (committeeIdOrCodeOrName || '').toLowerCase().trim();
  const cleanTargetCountry = (countryName || '').toLowerCase().trim();

  const all = await getAllCommittees();

  // First, remove delegate from any other committee / country
  for (const cmte of all) {
    let changed = false;
    cmte.countries = cmte.countries.map((c) => {
      if (c.assignedDelegate && c.assignedDelegate.toLowerCase().trim() === cleanDelegate.toLowerCase()) {
        changed = true;
        return { ...c, assignedDelegate: undefined };
      }
      return c;
    });
    if (changed) {
      await saveCommittee(cmte);
    }
  }

  if (!cleanTargetCommittee || !cleanTargetCountry) {
    return null;
  }

  // Find target committee
  const targetCmte = all.find((c) =>
    c.id.toLowerCase() === cleanTargetCommittee ||
    c.code.toLowerCase() === cleanTargetCommittee ||
    c.name.toLowerCase().includes(cleanTargetCommittee) ||
    cleanTargetCommittee.includes(c.code.toLowerCase())
  );

  if (!targetCmte) return null;

  // Find or add country in target committee
  const countryIdx = targetCmte.countries.findIndex(
    (c) => c.name.toLowerCase().trim() === cleanTargetCountry || cleanTargetCountry.includes(c.name.toLowerCase().trim())
  );

  if (countryIdx !== -1) {
    targetCmte.countries[countryIdx].assignedDelegate = cleanDelegate;
  } else {
    // If country is not in roster yet, add it
    targetCmte.countries.push({
      id: `cty_${countryName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}_${Math.random().toString(36).slice(2, 6)}`,
      name: countryName.trim(),
      flag: getCountryFlag(countryName),
      status: 'PRESENT',
      p5: targetCmte.code === 'UNSC' && ['United States', 'United Kingdom', 'France', "People's Republic of China", 'Russian Federation'].some((p) => countryName.toLowerCase().includes(p.toLowerCase())),
      bloc: 'General Member State',
      assignedDelegate: cleanDelegate,
    });
  }

  return await saveCommittee(targetCmte);
}

// Unassign delegate from all committees
export async function unassignDelegate(delegateName: string): Promise<boolean> {
  if (!delegateName) return true;
  const cleanDelegate = delegateName.toLowerCase().trim();
  const all = await getAllCommittees();

  for (const cmte of all) {
    let changed = false;
    cmte.countries = cmte.countries.map((c) => {
      if (c.assignedDelegate && c.assignedDelegate.toLowerCase().trim() === cleanDelegate) {
        changed = true;
        return { ...c, assignedDelegate: undefined };
      }
      return c;
    });
    if (changed) {
      await saveCommittee(cmte);
    }
  }
  return true;
}
