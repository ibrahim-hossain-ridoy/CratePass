import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  MAX_PDF_UPLOAD_BYTES,
  SignedUploadValidationError,
  buildScopedPdfStoragePath,
  downloadAndValidateStoredPdf,
  extractUuidFromScopedPdfPath,
  isAuthorizedScopedPdfPath,
  validateSignedUploadRequest,
} from "../lib/storage/signed-uploads.ts";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const REQ_1 = "33333333-3333-4333-8333-333333333333";
const REQ_2 = "44444444-4444-4444-8444-444444444444";
const FILE_1 = "55555555-5555-4555-8555-555555555555";

test("M14 signed upload path builder & scoping strictly enforce org prefix, purpose folder, and UUID .pdf regex", () => {
  const specPath = buildScopedPdfStoragePath({
    purpose: "spec",
    orgId: ORG_A,
    fileId: FILE_1,
  });
  assert.equal(specPath, `${ORG_A}/${FILE_1}.pdf`);
  assert.equal(
    isAuthorizedScopedPdfPath({ storagePath: specPath, purpose: "spec", orgId: ORG_A }),
    true,
  );
  assert.equal(extractUuidFromScopedPdfPath(specPath), FILE_1);

  const docPath = buildScopedPdfStoragePath({
    purpose: "doc",
    orgId: ORG_A,
    fileId: FILE_1,
  });
  assert.equal(docPath, `${ORG_A}/doc/${FILE_1}.pdf`);
  assert.equal(
    isAuthorizedScopedPdfPath({ storagePath: docPath, purpose: "doc", orgId: ORG_A }),
    true,
  );
  assert.equal(extractUuidFromScopedPdfPath(docPath), FILE_1);

  const supplierPath = buildScopedPdfStoragePath({
    purpose: "supplier",
    orgId: ORG_A,
    requestId: REQ_1,
    fileId: FILE_1,
  });
  assert.equal(supplierPath, `${ORG_A}/supplier/${REQ_1}/${FILE_1}.pdf`);
  assert.equal(
    isAuthorizedScopedPdfPath({
      storagePath: supplierPath,
      purpose: "supplier",
      orgId: ORG_A,
      requestId: REQ_1,
    }),
    true,
  );

  // Reject cross-org, cross-request, cross-purpose, path traversal, non-UUID, and non-.pdf paths
  const forbiddenPaths = [
    // Cross-org IDOR
    { storagePath: `${ORG_B}/${FILE_1}.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_B}/doc/${FILE_1}.pdf`, purpose: "doc", orgId: ORG_A },
    {
      storagePath: `${ORG_B}/supplier/${REQ_1}/${FILE_1}.pdf`,
      purpose: "supplier",
      orgId: ORG_A,
      requestId: REQ_1,
    },
    // Cross-request supplier path
    {
      storagePath: `${ORG_A}/supplier/${REQ_2}/${FILE_1}.pdf`,
      purpose: "supplier",
      orgId: ORG_A,
      requestId: REQ_1,
    },
    // Cross-purpose folder mixup
    { storagePath: docPath, purpose: "spec", orgId: ORG_A },
    { storagePath: specPath, purpose: "doc", orgId: ORG_A },
    { storagePath: supplierPath, purpose: "spec", orgId: ORG_A },
    // Traversal / injection attempts
    { storagePath: `${ORG_A}/../${ORG_B}/${FILE_1}.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}/doc/../../${ORG_B}/doc/${FILE_1}.pdf`, purpose: "doc", orgId: ORG_A },
    { storagePath: `/${ORG_A}/${FILE_1}.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}//${FILE_1}.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}\\${FILE_1}.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}/${FILE_1}.pdf?download=1`, purpose: "spec", orgId: ORG_A },
    // Non-UUID or non-PDF extension
    { storagePath: `${ORG_A}/datasheet.pdf`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}/${FILE_1}.html`, purpose: "spec", orgId: ORG_A },
    { storagePath: `${ORG_A}/${FILE_1}.pdf.exe`, purpose: "spec", orgId: ORG_A },
    { storagePath: "", purpose: "spec", orgId: ORG_A },
  ];

  for (const candidate of forbiddenPaths) {
    assert.equal(
      isAuthorizedScopedPdfPath(candidate),
      false,
      `Expected path to be rejected: ${JSON.stringify(candidate)}`,
    );
  }
});

test("M14 validateSignedUploadRequest enforces 10 MB ceiling and strict application/pdf + .pdf rules", () => {
  assert.equal(MAX_PDF_UPLOAD_BYTES, 10 * 1024 * 1024);

  // Exact 10 MB ceiling passes
  const ok = validateSignedUploadRequest({
    fileName: "Cell Spec Sheet (Rev 2).pdf",
    fileSize: 10 * 1024 * 1024,
    mimeType: "application/pdf",
  });
  assert.equal(ok.safeFileName, "Cell-Spec-Sheet-Rev-2-.pdf");

  // 10 MB + 1 byte fails with HTTP 413
  assert.throws(
    () =>
      validateSignedUploadRequest({
        fileName: "oversized.pdf",
        fileSize: 10 * 1024 * 1024 + 1,
        mimeType: "application/pdf",
      }),
    (err) => err instanceof SignedUploadValidationError && err.status === 413,
  );

  // Zero-byte or negative file size fails with HTTP 400
  for (const badSize of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () =>
        validateSignedUploadRequest({
          fileName: "empty.pdf",
          fileSize: badSize,
          mimeType: "application/pdf",
        }),
      (err) => err instanceof SignedUploadValidationError && err.status === 400,
    );
  }

  // Non-application/pdf MIME types fail with HTTP 400
  for (const badMime of ["text/html", "image/png", "application/octet-stream", ""]) {
    assert.throws(
      () =>
        validateSignedUploadRequest({
          fileName: "spec.pdf",
          fileSize: 1024,
          mimeType: badMime,
        }),
      (err) => err instanceof SignedUploadValidationError && err.status === 400,
    );
  }

  // Non-.pdf filenames fail with HTTP 400
  assert.throws(
    () =>
      validateSignedUploadRequest({
        fileName: "payload.html",
        fileSize: 1024,
        mimeType: "application/pdf",
      }),
    (err) => err instanceof SignedUploadValidationError && err.status === 400,
  );
});

test("M14 downloadAndValidateStoredPdf validates %PDF- magic bytes & 10 MB cap and deletes invalid files from storage", async () => {
  const validPath = `${ORG_A}/${FILE_1}.pdf`;
  const removedPaths = [];

  // 1. Valid PDF passes without deletion
  const validPdfBytes = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF", "utf8");
  const validBucket = {
    async download() {
      return { data: new Blob([validPdfBytes], { type: "application/pdf" }), error: null };
    },
    async remove(paths) {
      removedPaths.push(...paths);
      return { error: null };
    },
  };
  const validRes = await downloadAndValidateStoredPdf({
    storageBucket: validBucket,
    storagePath: validPath,
    fileName: "spec.pdf",
  });
  assert.equal(validRes.bytes.byteLength, validPdfBytes.byteLength);
  assert.equal(removedPaths.length, 0);

  // 2. Spoofed non-PDF bytes (HTML/JS disguised as .pdf) MUST be rejected AND deleted from storage
  const fakeBytes = Buffer.from("<html><script>alert(1)</script></html>", "utf8");
  const removedSpoof = [];
  const spoofBucket = {
    async download() {
      return { data: new Blob([fakeBytes], { type: "application/pdf" }), error: null };
    },
    async remove(paths) {
      removedSpoof.push(...paths);
      return { error: null };
    },
  };
  await assert.rejects(
    () =>
      downloadAndValidateStoredPdf({
        storageBucket: spoofBucket,
        storagePath: validPath,
        fileName: "spoofed.pdf",
      }),
    (err) =>
      err instanceof SignedUploadValidationError &&
      err.status === 400 &&
      /%PDF-/i.test(err.message),
  );
  assert.deepEqual(
    removedSpoof,
    [validPath],
    "Invalid non-PDF object MUST be deleted from storage immediately",
  );

  // 3. Oversized (> 10 MB) downloaded object MUST be rejected with 413 AND deleted from storage
  const removedOversized = [];
  let arrayBufferCalled = false;
  const oversizedBucket = {
    async download() {
      const fakeBlob = {
        size: 10 * 1024 * 1024 + 512,
        async arrayBuffer() {
          arrayBufferCalled = true;
          return new ArrayBuffer(0);
        },
      };
      return { data: fakeBlob, error: null };
    },
    async remove(paths) {
      removedOversized.push(...paths);
      return { error: null };
    },
  };
  await assert.rejects(
    () =>
      downloadAndValidateStoredPdf({
        storageBucket: oversizedBucket,
        storagePath: validPath,
        fileName: "huge.pdf",
      }),
    (err) => err instanceof SignedUploadValidationError && err.status === 413,
  );
  assert.equal(
    arrayBufferCalled,
    false,
    "Oversized storage blob must be rejected before arrayBuffer() allocation",
  );
  assert.deepEqual(
    removedOversized,
    [validPath],
    "Oversized storage object MUST be deleted from storage",
  );
});

test("M14 signed upload endpoints and processing routes wire auth, scoping, and client direct-to-storage flow", () => {
  const repoRoot = process.cwd();

  const authSignedRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/uploads/signed-url/route.ts"),
    "utf8",
  );
  assert.ok(authSignedRoute.includes("getWorkspaceContext()"));
  assert.ok(authSignedRoute.includes("enforceRateLimit"));
  assert.ok(authSignedRoute.includes("validateSignedUploadRequest"));
  assert.ok(authSignedRoute.includes("buildScopedPdfStoragePath"));
  assert.ok(authSignedRoute.includes("createSignedUploadUrl("));

  const supplierSignedRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/supplier/[token]/signed-url/route.ts"),
    "utf8",
  );
  assert.ok(supplierSignedRoute.includes("isValidSupplierTokenFormat"));
  assert.ok(supplierSignedRoute.includes("hashSupplierToken"));
  assert.ok(supplierSignedRoute.includes("checkSupplierRequestActionable"));
  assert.ok(supplierSignedRoute.includes("enforceRateLimit"));
  assert.ok(supplierSignedRoute.includes("validateSignedUploadRequest"));
  assert.ok(supplierSignedRoute.includes("createSignedUploadUrl("));

  for (const rel of [
    "src/app/api/passports/extract/route.ts",
    "src/app/api/passports/simple-qr/route.ts",
    "src/app/api/supplier/[token]/route.ts",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.ok(
      src.includes("isAuthorizedScopedPdfPath"),
      `${rel} must validate authorized scoped storagePath`,
    );
    assert.ok(
      src.includes("downloadAndValidateStoredPdf"),
      `${rel} must download & validate stored PDF with cleanup on failure`,
    );
  }

  const newFlowSrc = fs.readFileSync(
    path.join(repoRoot, "src/components/workspace/NewPassportFlow.tsx"),
    "utf8",
  );
  assert.ok(newFlowSrc.includes("/api/uploads/signed-url"));
  assert.ok(newFlowSrc.includes("uploadPdfViaSignedUrl"));

  const supplierFormSrc = fs.readFileSync(
    path.join(repoRoot, "src/components/supplier/SupplierPortalForm.tsx"),
    "utf8",
  );
  assert.ok(supplierFormSrc.includes("/signed-url"));
  assert.ok(supplierFormSrc.includes("uploadPdfViaSignedUrl"));
});
