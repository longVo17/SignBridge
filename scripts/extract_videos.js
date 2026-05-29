const fs = require('fs');
const path = require('path');

// Đường dẫn tới file JSON và thư mục videos bạn vừa tải về
const WLASL_JSON_PATH = path.join(__dirname, '../../../archive/WLASL_v0.3.json');
const SOURCE_VIDEOS_DIR = path.join(__dirname, '../../../archive/videos');

// Thư mục đích để lưu các video đã được đổi tên (trong dự án)
const DEST_DIR = path.join(__dirname, '../assets/extracted_videos');

// Danh sách các từ vựng cần trích xuất (30 từ + 26 chữ cái)
const TARGET_WORDS = [
  // Greetings
  'hello', 'goodbye', 'please', 'thank you', 'sorry', 'yes', 'no',
  // Basics
  'help', 'want', 'need', 'understand', 'like',
  // Daily
  'eat', 'drink', 'sleep', 'work', 'school', 'home',
  // Family
  'mother', 'father', 'baby', 'friend',
  // Numbers
  'one', 'two', 'three', 'five', 'ten',
  // Colors
  'blue', 'red', 'green',
  // Alphabet
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
];

async function extractVideos() {
  console.log('🔍 Bắt đầu đọc file WLASL_v0.3.json...');
  
  if (!fs.existsSync(WLASL_JSON_PATH)) {
    console.error(`❌ Không tìm thấy file JSON tại: ${WLASL_JSON_PATH}`);
    return;
  }

  // Đọc file JSON của WLASL
  const rawData = fs.readFileSync(WLASL_JSON_PATH, 'utf-8');
  const dataset = JSON.parse(rawData);
  
  // Tạo thư mục đích nếu chưa có
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  let foundCount = 0;
  let missingWords = [];

  for (const target of TARGET_WORDS) {
    // Tìm object chứa từ vựng trong dataset
    const entry = dataset.find(item => item.gloss.toLowerCase() === target.toLowerCase());
    
    if (!entry) {
      console.log(`⚠️ Từ '${target}' không có trong dataset WLASL.`);
      missingWords.push(target);
      continue;
    }

    let videoFound = false;

    // Lặp qua các video instance của từ này
    for (const instance of entry.instances) {
      const videoId = instance.video_id;
      // WLASL thường đặt tên file là <video_id>.mp4, có thể có số 0 ở đầu (00335.mp4) hoặc không (335.mp4)
      // Thử vài định dạng tên file
      const possibleNames = [
        `${videoId}.mp4`,
        `${videoId.padStart(5, '0')}.mp4`
      ];

      for (const fileName of possibleNames) {
        const sourcePath = path.join(SOURCE_VIDEOS_DIR, fileName);
        if (fs.existsSync(sourcePath)) {
          // Định dạng tên file đích: "thank you" -> "thankyou.mp4", "a" -> "asl_a.mp4"
          let destFileName = target.replace(/\s+/g, '') + '.mp4';
          if (target.length === 1) {
            destFileName = `asl_${target}.mp4`; // Đặt tên cho bảng chữ cái để giống ID trong seed.cjs
          }
          
          const destPath = path.join(DEST_DIR, destFileName);
          
          // Copy file
          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Đã copy: [${target}] (từ file ${fileName})`);
          
          videoFound = true;
          foundCount++;
          break; // Chỉ cần 1 video cho mỗi từ
        }
      }

      if (videoFound) break;
    }

    if (!videoFound) {
      console.log(`❌ Có từ '${target}' trong JSON nhưng không tìm thấy file video nào trong máy!`);
      missingWords.push(target);
    }
  }

  console.log('\n=======================================');
  console.log(`🎉 Đã trích xuất thành công: ${foundCount} / ${TARGET_WORDS.length} video.`);
  if (missingWords.length > 0) {
    console.log(`⚠️ Các từ còn thiếu video: \n${missingWords.join(', ')}`);
  }
  console.log(`📁 Video đã được lưu tại: ${DEST_DIR}`);
  console.log('=======================================');
}

extractVideos();
