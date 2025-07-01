const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const upload = multer();
const port = process.env.PORT || 4000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

app.post('/api/generate-copy', upload.single('image'), async (req, res) => {
  const copyType = req.body.copyType;
  // 예시 스타일 분석 (실제로는 이미지에서 추출 예정)
  const exampleStyle = "여름 도트 원피스, 데님, 자연광, 레트로 무드";

  const prompt = `
이미지 스타일: ${exampleStyle}
배너 형식: ${copyType === "mypage" ? "13자 × 2줄" : "18자 1줄"}

지침:
- 마이페이지 배너는 1줄당 13자, 총 2줄로 구성돼야 합니다
- 띠배너는 1줄, 18자 이내로 작성합니다
- 두 줄은 자연스럽게 연결되어야 하며, 말하듯 감각적이어야 합니다
- 리듬감, 말맛, 감성이 중요하며 단순 정보 나열은 피해주세요
- 스타일 키워드는 도트, 레트로, 감성, 꾸안꾸, 자연광 등입니다

이 조건을 지켜서 실제 브랜드에 쓸 수 있는 배너 문구를 3개 생성해주세요.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });
    const raw = completion.choices[0].message.content || "";
    const copies = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => line.trim());
    res.json({ copies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Banner Copy API server running on port ${port}`);
}); 