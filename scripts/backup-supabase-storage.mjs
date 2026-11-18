import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const [outputDirectory] = process.argv.slice(2);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!outputDirectory || !supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e o diretório de saída são obrigatórios.");

const outputRoot = resolve(outputDirectory);
const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" };

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${url} falhou (${response.status}): ${await response.text()}`);
  return response;
}

function localPath(bucketName, objectName) {
  const path = resolve(outputRoot, bucketName, ...objectName.split("/"));
  if (!path.startsWith(`${outputRoot}${sep}`)) throw new Error(`Nome de objeto inválido para backup: ${objectName}`);
  return path;
}

function objectUrl(bucketName, objectName) {
  return `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${objectName.split("/").map(encodeURIComponent).join("/")}`;
}

async function listObjects(bucketName, prefix = "") {
  const items = [];
  const limit = 1000;
  for (let offset = 0; ; offset += limit) {
    const response = await request(`${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(bucketName)}`, {
      method: "POST",
      body: JSON.stringify({ prefix, limit, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const page = await response.json();
    items.push(...page);
    if (page.length < limit) return items;
  }
}

async function copyBucket(bucketName, prefix, manifest) {
  for (const object of await listObjects(bucketName, prefix)) {
    const objectName = prefix ? `${prefix}/${object.name}` : object.name;
    if (!object.id) {
      await copyBucket(bucketName, objectName, manifest);
      continue;
    }
    const destination = localPath(bucketName, objectName);
    await mkdir(dirname(destination), { recursive: true });
    const response = await request(objectUrl(bucketName, objectName));
    const contents = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, contents);
    manifest.objects.push({ bucket: bucketName, path: objectName, bytes: contents.byteLength, updatedAt: object.updated_at ?? null });
  }
}

await mkdir(outputRoot, { recursive: true });
const buckets = await (await request(`${supabaseUrl}/storage/v1/bucket`)).json();
const manifest = { createdAtUtc: new Date().toISOString(), buckets: [], objects: [] };
for (const bucket of buckets) {
  const bucketName = bucket.name ?? bucket.id;
  manifest.buckets.push(bucketName);
  await copyBucket(bucketName, "", manifest);
}
await writeFile(resolve(outputRoot, "storage-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Storage concluído: ${manifest.objects.length} arquivo(s) em ${manifest.buckets.length} bucket(s).`);
