import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword } from '@/lib/utils/password';
import { z } from 'zod';

const registerSchema = z.object({
  organization: z.object({
    raisonSociale: z.string().min(2),
    siret: z.string().length(14),
    adressePostale: z.string().min(5),
  }),
  agency: z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().min(10),
  }),
  admin: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const USERS_PATH = path.join(process.cwd(), 'data', 'users-db.json');
    const ORGS_PATH = path.join(process.cwd(), 'data', 'organizations-db.json');
    const AGENCIES_PATH = path.join(process.cwd(), 'data', 'agencies-db.json');

    // Load DBs
    const [usersData, orgsData, agenciesData] = await Promise.all([
      fs.readFile(USERS_PATH, 'utf8'),
      fs.readFile(ORGS_PATH, 'utf8'),
      fs.readFile(AGENCIES_PATH, 'utf8'),
    ]);

    const users = JSON.parse(usersData);
    const organizations = JSON.parse(orgsData);
    const agencies = JSON.parse(agenciesData);

    // Check if user already exists
    if (users.find((u: any) => u.email.toLowerCase() === validatedData.admin.email.toLowerCase())) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà.' }, { status: 400 });
    }

    // 1. Create Organization
    const organizationId = `org_${Math.random().toString(36).substring(2, 11)}`;
    const newOrg = {
      id: organizationId,
      ...validatedData.organization,
      updatedAt: Date.now(),
      serverVersion: 1,
      lastModified: new Date().toISOString()
    };
    organizations.push(newOrg);

    // 2. Create Agency
    const agencyId = `agency_${Date.now()}`;
    const newAgency = {
      id: agencyId,
      organizationId,
      name: validatedData.agency.name,
      address: validatedData.agency.address,
      phone: validatedData.agency.phone,
      type: 'Siège',
      serverVersion: 1,
      lastModified: new Date().toISOString()
    };
    agencies.push(newAgency);

    // 3. Create Admin User
    const hashedPassword = await hashPassword(validatedData.admin.password);
    const newUser = {
      id: `user_${Math.random().toString(36).substring(2, 11)}`,
      name: `${validatedData.admin.firstName} ${validatedData.admin.lastName}`,
      email: validatedData.admin.email,
      password: hashedPassword,
      role: 'Administrateur',
      organizationId,
      agencyId,
      serverVersion: 1,
      lastModified: new Date().toISOString(),
      syncStatus: 'synced'
    };
    users.push(newUser);

    // Save all
    await Promise.all([
      fs.writeFile(ORGS_PATH, JSON.stringify(organizations, null, 2)),
      fs.writeFile(AGENCIES_PATH, JSON.stringify(agencies, null, 2)),
      fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2)),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\'inscription.' }, { status: 500 });
  }
}
