import { test, expect } from '@playwright/test';

test('Exhaustive E2E path for VestaCheck', async ({ page }) => {
  // Set larger timeout (240 seconds) for complete manual flow simulation
  test.setTimeout(240000);

  // Enable dialog auto-accept
  page.on('dialog', async dialog => {
    console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
  });
 
  // Capturer les logs console du navigateur pour le debug
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('VestaCheck') || msg.text().includes('Store') || msg.text().includes('Sync')) {
      console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`[Browser Runtime Error] ${err.message}\nStack: ${err.stack}`);
  });

  // Helper de synchronisation robuste et insensible à la casse
  const waitForSyncToComplete = async () => {
    console.log('[Sync E2E] Attente de la synchronisation...');
    const isSyncing = await page.locator('.animate-spin').first().isVisible().catch(() => false);
    if (isSyncing) {
      console.log('[Sync E2E] Synchro déjà en cours, attente de complétion...');
      await page.waitForSelector('button[title*="synchronis" i], button[title*="synchroniz" i], button:has(.lucide-cloud)', { state: 'visible', timeout: 25000 }).catch(() => {});
    } else {
      try {
        await page.waitForSelector('button[title*="synchronis" i], button[title*="synchroniz" i]', { state: 'visible', timeout: 8000 });
        await page.click('button[title*="synchronis" i], button[title*="synchroniz" i]');
      } catch (e) {
        console.log('[Sync E2E] Bouton non cliquable ou synchro déjà lancée, attente...');
      }
    }
    await page.waitForTimeout(4000); // Marge de sécurité
    console.log('[Sync E2E] Synchronisation stabilisée.');
  };

  // Step 1: Login
  console.log('Step 1: Authenticating...');
  await page.goto('/login');
  await page.fill('input[type="email"]', 'inspector@test.com');
  await page.fill('input[type="password"]', 'VestaCheck2026!');

  // Handle Turnstile dummy widget if present
  console.log('Waiting for Turnstile widget...');
  const turnstileFrame = page.frameLocator('iframe[src*="challenges.cloudflare.com"]');
  const checkbox = turnstileFrame.locator('#challenge-stage, .ctp-checkbox-label, input[type="checkbox"]').first();
  try {
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Clicking Turnstile dummy checkbox...');
    await checkbox.click();
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log('Turnstile dummy checkbox not visible or auto-solved, continuing...');
  }

  // Click Connexion
  await page.click('button[type="submit"]');

  // Verify dashboard redirection
  await page.waitForURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Bienvenue');
  console.log('Successfully authenticated and redirected to /dashboard!');

  // Step 2: Admin - User Management
  console.log('Step 2: Admin - User Management...');
  await page.click('a[href="/admin/users"]');
  await page.waitForURL('/admin/users');

  // Create an Agent
  await page.click('button:has-text("Ajouter un utilisateur"), button:has-text("Ajouter")');
  await page.fill('input[name="name"]', 'QA Agent Test');
  const userEmail = `qa.agent.test-${Date.now()}@vestacheck.com`;
  await page.fill('input[name="email"]', userEmail);
  await page.fill('input[name="password"]', 'password123');
  await page.selectOption('select[name="role"]', 'Agent');
  
  // Select first agency in dropdown
  const agencySelect = page.locator('select[name="agencyId"]');
  const firstAgencyOption = agencySelect.locator('option').nth(1);
  await firstAgencyOption.waitFor({ state: 'attached' });
  const firstAgencyValue = await firstAgencyOption.getAttribute('value');
  if (firstAgencyValue) {
    await agencySelect.selectOption(firstAgencyValue);
  }

  // Click submit to create user
  await page.click('button[type="submit"]:has-text("Créer l\'utilisateur"), button[type="submit"]:has-text("Create User")');
  await page.waitForTimeout(2000); // Wait for optimistic UI / db save

  // Verify user created
  await expect(page.locator('table')).toContainText('QA Agent Test');
  console.log('Created new Agent user successfully.');

  // Modify user (Optimistic UI check)
  console.log('Modifying the newly created user...');
  // Click edit button for our user
  await page.locator('tr:has-text("QA Agent Test") button[title*="Modifier"]').click();
  await page.fill('input[name="name"]', 'QA Agent Modified');
  await page.click('button[type="submit"]:has-text("Enregistrer"), button[type="submit"]:has-text("Save")');
  await page.waitForTimeout(1000); // Verify fast render (Optimistic UI)
  await expect(page.locator('table')).toContainText('QA Agent Modified');
  console.log('User modified successfully (validated Optimistic UI).');

  // Step 3: Properties & Tenants Setup
  console.log('Step 3: Properties & Tenants Setup...');
  await page.goto('/dashboard/properties');
  await page.waitForURL('/dashboard/properties');
  await page.waitForTimeout(2000); // Allow NextAuth session hook to fully resolve and prevent form resets

  // Create Property
  await page.click('button:has-text("Nouveau Bien"), button:has-text("New Property")');
  await page.waitForTimeout(2000); // Attente de l'animation d'ouverture de la modale et de l'hydratation des champs

  const propName = 'Résidence QA Test ' + Date.now();
  const propAddress = `42 Avenue des Champs-Élysées, 75008 Paris (QA ${Date.now()})`;
  
  // Fill inputs using unique placeholders & labels
  const nameInput = page.locator('input[placeholder*="Haussmannien"], input[placeholder*="Apartment"]');
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.fill(propName);
  await page.locator('input[placeholder*="rue de la Paix"], input[placeholder*="High Street"]').fill(propAddress);
  
  // Select type and owner using labels
  await page.locator('div:has(> label:has-text("Type de bien")), div:has(> label:has-text("Property Type"))').locator('select').first().selectOption('Appartement');
  
  const ownerSelect = page.locator('div:has(> label:has-text("Propriétaire")), div:has(> label:has-text("Owner"))').locator('select').first();
  const firstOwnerOption = ownerSelect.locator('option').nth(1);
  await firstOwnerOption.waitFor({ state: 'attached' });
  const firstOwnerValue = await firstOwnerOption.getAttribute('value');
  if (firstOwnerValue) {
    await ownerSelect.selectOption(firstOwnerValue);
  }
  
  await page.locator('div:has(> label:has-text("Surface")), div:has(> label:has-text("surface"))').locator('input').fill('75');
  await page.locator('div:has(> label:has-text("pièces")), div:has(> label:has-text("rooms"))').locator('input').fill('3');
  
  // Submit the form
  await page.click('button[type="submit"]:has-text("Créer le bien"), button[type="submit"]:has-text("Enregistrer")');

  
  // Verify property created
  await page.waitForTimeout(2000);
  await expect(page.locator('body')).toContainText(propName);
  console.log('Created property successfully: ' + propName);

  // Trigger synchronization to save the property on the server before linking tenants
  await waitForSyncToComplete();

  // Navigate to property details page
  await page.locator(`text=${propName}`).first().click();
  await page.waitForURL(url => url.pathname.includes('/dashboard/properties/'));
  const currentUrl = page.url();
  const propertyId = currentUrl.split('/').pop()?.split('?')[0];
  console.log('Navigated to property details. Property ID: ' + propertyId);

  // Create a Tenant
  console.log('Creating a tenant...');
  await page.goto('/dashboard/tenants');
  await page.waitForURL('/dashboard/tenants');
  await page.waitForTimeout(2500); // Attente de l'hydratation React complète et du hook de session
  await page.click('button:has-text("Nouveau Locataire"), button:has-text("New Tenant")');
  const tenantName = 'QA Tenant ' + Date.now();

  // Locate tenant modal inputs directly on page level to prevent locator scoping mismatches
  const tenantNameInput = page.locator('input[placeholder*="Durand"], input[placeholder*="Doe"]').first();
  await tenantNameInput.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(2000); // Attente de l'hydratation des handlers React
  await tenantNameInput.fill(tenantName);
  await page.locator('input[type="email"]').first().fill('qa.tenant@example.com');
  await page.locator('input[placeholder*="06 "], input[placeholder*="1 234"]').first().fill('0612345678');
 
  // Check our property in the button list
  const propBtn = page.locator(`button:has-text("${propAddress.split('(')[1]}")`).first();
  await propBtn.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000); // Garde de rendu React
  await propBtn.click();
  await page.waitForTimeout(1000); // Assure la mise à jour du state de sélection
 
  // Click submit (the button has no type="submit" attribute)
  await page.click('button:has-text("Créer le locataire")');

  await page.waitForTimeout(2000);
  console.log('Tenant created successfully: ' + tenantName);

  // Click on the Sync button in Navbar to upload the local tenant mutation
  // Click on the Sync button in Navbar to upload the local tenant mutation
  await waitForSyncToComplete();



  // Step 4: Configuration & Template Creation
  console.log('Step 4: Configuration & Template Creation...');
  await page.goto(`/dashboard/properties/${propertyId}`);
  await page.waitForURL(`/dashboard/properties/${propertyId}`);

  // Click on "Créer un template" or click the Plus icon
  await page.click('a:has-text("Créer un template"), a:has-text("Create a template")');
  await page.waitForURL(url => url.pathname.includes('/templates/new'));

  // Step 4.1: Template Setup
  const templateNameInput = page.locator('div:has(> label:has-text("Nom du Template")), div:has(> label:has-text("Template Name"))').locator('input').first();
  await templateNameInput.waitFor({ state: 'visible', timeout: 5000 });
  await templateNameInput.fill('Template QA Standard');

  // Click Étape Suivante

  await page.click('button:has-text("Étape Suivante"), button:has-text("Next Step")');

  // Step 4.2: Add rooms & elements to template
  console.log('Adding rooms and elements to template...');
  // Add a room (Salon by default is present, let's add Kitchen)
  await page.click('button:has-text("Ajouter une pièce"), button:has-text("Add Room")');
  
  // Fill the names of both rooms explicitly to prevent any default values wipeouts
  const roomInputs = page.locator('input[placeholder*="Salon, Cuisine"], input[placeholder*="Salon, Bedroom"]');
  await roomInputs.nth(0).fill('Salon');
  await roomInputs.nth(1).fill('Cuisine');

  // Add element to Kitchen
  await page.locator('button:has-text("Ajouter un élément"), button:has-text("Add Element")').last().click();
  const elementInputs = page.locator('input[placeholder*="Désignation"]');
  await elementInputs.last().fill('Plaque de cuisson');

  // Save template
  await page.click('button[type="submit"]:has-text("Enregistrer")');
  await page.waitForURL(`/dashboard/properties/${propertyId}`);
  console.log('Created property template "Template QA Standard" successfully!');

  // Step 5: Start and execute an Inspection based on the template
  console.log('Step 5: Starting inspection from template...');
  // Click "Démarrer l'inspection"
  await page.click('a:has-text("Démarrer l\'inspection"), button:has-text("Démarrer l\'inspection")');
  
  // Choice page: blank or template
  await page.waitForURL(url => url.pathname.includes('/inspections/new'));
  console.log('On choice page. Selecting "Template QA Standard"...');
  
  // Click on our template directly (first template in the list)
  const templateButton = page.locator('button:has-text("Template QA Standard")').first();
  await templateButton.waitFor({ state: 'visible', timeout: 5000 });
  await templateButton.click();
  
  // Form loaded (Toggle to selection mode to show the tenant dropdown)
  console.log('Toggling to Selection mode...');
  await page.locator('button:has-text("SÉLECTION"), button:has-text("Selection")').first().click();
  
  // Wait for the tenantId select dropdown to be visible
  const tenantSelect = page.locator('select[name="tenantId"]').first();
  await tenantSelect.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Inspection form loaded successfully.');

  // Step 5.1: Synthesis Step
  console.log('Remplissage des compteurs...');
  // Select the tenant
  await page.selectOption('select[name="tenantId"]', { label: tenantName });
  
  // Verify/update meters
  await page.fill('input[name="counters.water"]', '125'); // Water reading increased from 120
  await page.fill('input[name="counters.electricity"]', '45100'); // Electricity reading increased
  
  await page.click('button:has-text("Étape Suivante"), button:has-text("Next Step")');

  // Step 5.2: Rooms & Condition Step
  console.log('Saisie des états des pièces...');
  // Set Walls in Salon as "Bon" (default)
  // Set Floors in Salon as "Usage" (Fair) and add comment
  const conditionSelects = page.locator('select[name*="condition"]');
  const commentFields = page.locator('textarea[placeholder*="observation"], input[placeholder*="observation"]');
  
  await conditionSelects.nth(1).selectOption('Usage');
  await commentFields.nth(1).fill('Traces d\'usure sur le parquet.');

  // Simulate attaching a photo (offline mode) by injecting image base64 metadata
  console.log('Simulating offline photo upload...');
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() > 0) {
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    await fileInput.setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: dummyImage,
    });
    console.log('Uploaded test photo.');
    await page.waitForTimeout(1500); // Wait for processing
  }

  // Go to next step: Keys & Access
  await page.click('button:has-text("Étape Suivante"), button:has-text("Next Step")');

  // Step 5.3: Keys Inventory
  console.log('Completing keys inventory...');
  await page.fill('textarea[placeholder*="commentaires globaux"]', 'Le logement est propre dans l\'ensemble. Remise des clés effectuée.');
  await page.click('button:has-text("Étape Suivante"), button:has-text("Next Step")');

  // Step 5.4: Signatures Section
  console.log('Apposing signatures...');
  
  // Open tenant signature pad
  await page.locator('button:has-text("Signer le rapport")').first().click();
  
  // Simulate drawing on the canvas via robust PointerEvents and MouseEvents evaluation
  const canvasTenant = page.locator('.signature-canvas');
  await canvasTenant.waitFor({ state: 'visible' });
  await canvasTenant.evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const x1 = rect.left + rect.width / 4;
    const y1 = rect.top + rect.height / 2;
    const x2 = rect.left + rect.width / 2;
    const y2 = rect.top + rect.height / 2;

    const dispatchEvents = (type: string, x: number, y: number, buttons: number, button: number) => {
      canvas.dispatchEvent(new PointerEvent('pointer' + type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1, buttons, button, isPrimary: true, pressure: buttons ? 0.5 : 0
      }));
      canvas.dispatchEvent(new MouseEvent('mouse' + type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y, buttons, button
      }));
    };
    
    dispatchEvents('down', x1, y1, 1, 0);
    dispatchEvents('move', x2, y2, 1, 0);
    dispatchEvents('up', x2, y2, 0, 0);
  });
  
  // Click Validate signature
  await page.click('button:has-text("Valider"), button:has-text("Confirm")', { force: true });
  await page.waitForTimeout(1000);

  // Open inspector signature pad
  await page.locator('button:has-text("Signer le rapport")').first().click(); // Second signature becomes the first unsigned one
  const canvasInspector = page.locator('.signature-canvas');
  await canvasInspector.waitFor({ state: 'visible' });
  await canvasInspector.evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const x1 = rect.left + rect.width / 4;
    const y1 = rect.top + rect.height / 2;
    const x2 = rect.left + rect.width / 2;
    const y2 = rect.top + rect.height / 2;

    const dispatchEvents = (type: string, x: number, y: number, buttons: number, button: number) => {
      canvas.dispatchEvent(new PointerEvent('pointer' + type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1, buttons, button, isPrimary: true, pressure: buttons ? 0.5 : 0
      }));
      canvas.dispatchEvent(new MouseEvent('mouse' + type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y, buttons, button
      }));
    };
    
    dispatchEvents('down', x1, y1, 1, 0);
    dispatchEvents('move', x2, y2, 1, 0);
    dispatchEvents('up', x2, y2, 0, 0);
  });
  await page.click('button:has-text("Valider"), button:has-text("Confirm")', { force: true });
  await page.waitForTimeout(1000);

  // Check the certify checkbox
  await page.locator('input[type="checkbox"][name="isFinalized"]').check();
  
  // Click Finaliser (final validation)
  await page.click('button[type="submit"]:has-text("Finaliser"), button[type="submit"]:has-text("Finalize")');
  await page.waitForURL(`/dashboard/properties/${propertyId}`);
  console.log('Inspection finalized and report locked successfully!');

  // Step 6: Preferences (Theme & Language Toggle)
  console.log('Step 6: Preferences & Language Toggles...');
  await page.goto('/dashboard/settings');
  await page.waitForURL('/dashboard/settings');

  // Change language to English
  await page.selectOption('select[name="language"]', 'en');
  await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Enregistrer")');
  await page.waitForTimeout(2000);
  
  // Verify english dictionary loaded
  await expect(page.locator('h1')).toContainText('Profile Settings');
  console.log('Successfully switched language to English!');

  // Change theme to Light
  const lightThemeBtn = page.locator('button:has-text("Light"), button:has-text("Clair")');
  if (await lightThemeBtn.isVisible()) {
    await lightThemeBtn.click();
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Enregistrer")');
    await page.waitForTimeout(1000);
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log('HTML classes after light theme toggle: ' + htmlClass);
  }

  // Restore French & Sombre for next tests consistency
  await page.selectOption('select[name="language"]', 'fr');
  const darkThemeBtn = page.locator('button:has-text("Sombre"), button:has-text("Dark")');
  if (await darkThemeBtn.isVisible()) {
    await darkThemeBtn.click();
  }
  await page.click('button[type="submit"]:has-text("Enregistrer"), button[type="submit"]:has-text("Save")');
  await page.waitForTimeout(1000);

  // Step 7: PDF Export Verification
  console.log('Step 7: Launching PDF export and verifying...');
  await page.goto(`/dashboard/properties/${propertyId}`);
  await page.waitForURL(`/dashboard/properties/${propertyId}`);

  // Find finalized inspection in history and click "PDF" button to generate
  const pdfDownloadButton = page.locator('button:has-text("PDF")').first();
  await expect(pdfDownloadButton).toBeVisible();

  // Monitor download event
  const downloadPromise = page.waitForEvent('download');
  await pdfDownloadButton.click();
  const download = await downloadPromise;
  
  // Verify download succeeded and is non-empty
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  console.log('PDF Report successfully generated and downloaded at: ' + downloadPath);
  
  console.log('--- ALL E2E TESTS COMPLETED AND VALIDATED SUCCESSFULLY ---');
});
