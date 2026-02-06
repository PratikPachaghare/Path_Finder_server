import CareerPath from "../models/CareerPath.js";

export const getUserCareerPaths = async (req, res) => {
  try {
    const userID = req.params.userId; // Ensure this matches route parameter

    if (!userID) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const careerPaths = await CareerPath.find({ user: userID }).sort({ createdAt: -1 });

    if (careerPaths.length === 0) {
      return res.status(404).json({ success: false, message: "No career paths found for this user." });
    }

    res.status(200).json({ success: true, count: careerPaths.length, data: careerPaths });
  } catch (error) {
    console.error("Error fetching user career paths:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


export const getCareerPathById = async (req, res) => {
  // const userID = req.params.id;
  const  pathID = req.params.id
  // const userID = 'req.user.id';
  // const userID = req.body.userId;
  // const userID = '67c3004034fbff000c87ffd8';
  try {
    const careerPath = await CareerPath.findOne({ _id: pathID, user: userID });

    if (!careerPath) {
      return res.status(404).json({ error: "Career path not found" });
    }

    res.status(200).json({ success: true, data: careerPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};


export const getDeleteRoadmapById = async (req,res)=>{
    const pathId = req.params.id;

    try {
      const roadmap = await CareerPath.findOne({_id:pathId});

      if(!roadmap){
          console.log("roadmap not find :");
          res.status(200).json({
            success:false,
            massage:"roadmap not in data bases faild to serch "
          })
      }
      const deleteRoadmpa = await CareerPath.deleteOne({_id:pathId});

      res.status(200).json({
        success:true,
        massage:"roadmap deleted succufuly",
        deleteRoadmpa
      })

    } catch (error) {
      res.status(404).json({
        success:false,
        massage:"faild to delete roadmap by path id"
      })
      console.log("error in geDeleteRoadmapById :",error);
    }
}

import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_ANYLESIS_RESUME,
});

export const enhanceResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: "Resume data is required." });
    }

    const enhancementPrompt = `
      Act as an expert career coach. Rewrite the following resume data to perfectly match the Job Description: "${jobDescription}".
      
      RULES:
      1. Return ONLY a JSON object.
      2. The structure must be EXACTLY like the input resumeData.
      3. Use professional keywords and quantify achievements.
      4. Calculate "atsscore" (before enhancement) and "atsScore" (after enhancement).

      INPUT DATA:
      ${JSON.stringify(resumeData)}

      EXPECTED JSON RESPONSE FORMAT:
      {
        "atsscore": number,
        "atsScore": number,
        "reasons": ["string"],
        "enhancedData": {
          "personalInfo": { "fullName": "...", "jobTitle": "...", "summary": "..." },
          "experience": [{ "title": "...", "company": "...", "desc": "..." }],
          "education": [{ "school": "...", "degree": "..." }],
          "skills": ["string"],
          "projects": [{ "title": "...", "desc": "..." }],
          "certifications": [{ "name": "..." }],
          "strengths": ["string"]
        }
      }
    `;

    const response = await groq.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant that outputs only JSON." }, 
                 { role: "user", content: enhancementPrompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);

    res.status(200).json({
      message: "Resume successfully enhanced",
      ...aiResponse // Includes atsscore, atsScore, reasons, and enhancedData
    });

  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};