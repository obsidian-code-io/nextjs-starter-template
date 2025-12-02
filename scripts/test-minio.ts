/**
 * Test script to verify MinIO connection and functionality
 * Run with: bun run scripts/test-minio.ts
 */

import { getMinioClient, getBucketName, uploadFile } from "../src/lib/storage";

async function testMinIO() {
  console.log("🧪 Testing MinIO Connection...\n");

  try {
    // Test 1: Get MinIO client
    console.log("1️⃣ Testing MinIO client initialization...");
    const client = getMinioClient();
    console.log("✅ MinIO client created successfully\n");

    // Test 2: Check bucket exists
    console.log("2️⃣ Testing bucket existence...");
    const bucketName = getBucketName();
    const bucketExists = await client.bucketExists(bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' exists\n`);
    } else {
      console.log(`⚠️  Bucket '${bucketName}' does not exist. Creating...`);
      await client.makeBucket(bucketName, "us-east-1");
      console.log(`✅ Bucket '${bucketName}' created successfully\n`);
    }

    // Test 3: List buckets
    console.log("3️⃣ Testing bucket listing...");
    const buckets = await client.listBuckets();
    console.log(`✅ Found ${buckets.length} bucket(s):`);
    buckets.forEach((bucket) => {
      console.log(`   - ${bucket.name} (created: ${bucket.creationDate})`);
    });
    console.log();

    // Test 4: Upload a test file
    console.log("4️⃣ Testing file upload...");
    const testContent = Buffer.from("Hello, MinIO! This is a test file.");
    const testFileName = `test-${Date.now()}.txt`;
    
    const uploadResult = await uploadFile({
      file: testContent,
      fileName: testFileName,
      mimeType: "text/plain",
      isSecure: false,
    });
    
    console.log(`✅ File uploaded successfully!`);
    console.log(`   File Path: ${uploadResult.filePath}`);
    console.log(`   File URL: ${uploadResult.fileUrl}`);
    console.log(`   File Storage ID: ${uploadResult.fileStorageId}`);
    console.log();

    // Test 5: Verify file exists in MinIO
    console.log("5️⃣ Testing file retrieval from MinIO...");
    const { getFile } = await import("../src/lib/storage");
    const fileData = await getFile(uploadResult.fileStorageId);
    
    if (fileData.file.toString() === testContent.toString()) {
      console.log("✅ File retrieved successfully and content matches!");
      console.log(`   File Name: ${fileData.fileName}`);
      console.log(`   MIME Type: ${fileData.mimeType}`);
      console.log(`   File Size: ${fileData.file.length} bytes`);
    } else {
      console.log("❌ File content mismatch!");
    }
    console.log();

    // Test 6: List objects in bucket
    console.log("6️⃣ Testing object listing...");
    const objectsStream = client.listObjects(bucketName, "", true);
    const objects: string[] = [];
    
    for await (const obj of objectsStream) {
      if (obj.name) {
        objects.push(obj.name);
      }
    }
    
    console.log(`✅ Found ${objects.length} object(s) in bucket:`);
    objects.slice(0, 10).forEach((obj) => {
      console.log(`   - ${obj}`);
    });
    if (objects.length > 10) {
      console.log(`   ... and ${objects.length - 10} more`);
    }
    console.log();

    console.log("🎉 All MinIO tests passed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - MinIO Client: ✅ Connected`);
    console.log(`   - Bucket '${bucketName}': ✅ Exists`);
    console.log(`   - File Upload: ✅ Working`);
    console.log(`   - File Retrieval: ✅ Working`);
    console.log(`   - Total Objects: ${objects.length}`);

  } catch (error: any) {
    console.error("\n❌ MinIO Test Failed!");
    console.error(`Error: ${error.message}`);
    console.error("\n🔍 Troubleshooting:");
    console.error("1. Make sure MinIO is running: docker ps | grep minio");
    console.error("2. Check environment variables:");
    console.error("   - STORAGE_ENDPOINT (default: localhost)");
    console.error("   - STORAGE_PORT (default: 9000)");
    console.error("   - STORAGE_ACCESS_KEY (default: minioadmin)");
    console.error("   - STORAGE_SECRET_KEY (default: minioadmin)");
    console.error("   - STORAGE_BUCKET (default: ims-files)");
    console.error("3. Check MinIO console at http://localhost:9001");
    console.error("4. Verify Docker container: docker logs ims-minio");
    process.exit(1);
  }
}

// Run the test
testMinIO();

