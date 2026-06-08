import { addChatMessage, getSessionMessages } from "../database/chat.repository";
import { searchCars } from "./tools/searchCars";
import { compareCars } from "./tools/compareCars";
import { recommendCars } from "./tools/recommendCars";
import { calculateLoan } from "./tools/calculateLoan";
import { createLead } from "./tools/createLead";
import { createAppointment } from "./tools/createAppointment";
import { getCarDetailById, getCarsForRecommendation } from "../database/recommendation.repository";

const MODEL_NAME = "gemini-3.1-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// 9 Gemini Tool declarations
const SYSTEM_TOOLS = [
  {
    "functionDeclarations": [
      {
        "name": "searchCars",
        "description": "Tìm kiếm xe trong kho theo các điều kiện lọc như ngân sách, hãng xe, nhiên liệu, số chỗ.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "budget": { "type": "NUMBER", "description": "Số tiền tối đa bằng VND, ví dụ 800000000" },
            "brand": { "type": "STRING", "description": "Hãng xe, ví dụ Toyota, Mazda" },
            "fuel": { "type": "STRING", "description": "Nhiên liệu: Xăng, Dầu, Điện, Hybrid" },
            "seats": { "type": "NUMBER", "description": "Số chỗ ngồi, ví dụ 5, 7" },
            "priceRange": { "type": "STRING", "description": "Khoảng giá triệu VND, ví dụ 500-800" }
          }
        }
      },
      {
        "name": "compareCars",
        "description": "So sánh thông số kỹ thuật chi tiết của các xe bằng cách truyền vào danh sách ID xe.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "carIds": {
              "type": "ARRAY",
              "items": { "type": "STRING" },
              "description": "Mảng chứa các ID xe cần so sánh"
            }
          },
          "required": ["carIds"]
        }
      },
      {
        "name": "recommendCars",
        "description": "Đề xuất top xe phù hợp nhất dựa trên ngân sách, mục đích sử dụng, nhiên liệu, số ghế và ưu tiên.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "budget": { "type": "STRING", "description": "Ngân sách, ví dụ '< 500', '500-800', '800-1000', '1000-1500', '> 1500'" },
            "purpose": { "type": "STRING", "description": "Mục đích: gia đình, dịch vụ, đi phố, doanh nhân, offroad" },
            "fuel": { "type": "STRING", "description": "Nhiên liệu: Xăng, Dầu, Điện, Hybrid" },
            "seats": { "type": "NUMBER", "description": "Số chỗ ngồi, ví dụ 5, 7" },
            "priority": { "type": "STRING", "description": "Ưu tiên: economy, safety, luxury, technology, comfort" }
          }
        }
      },
      {
        "name": "calculateLoan",
        "description": "Tính toán tiền trả góp hàng tháng, tiền lãi và tổng chi phí mua xe trả góp.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "price": { "type": "NUMBER", "description": "Giá trị xe (VND)" },
            "downPayment": { "type": "NUMBER", "description": "Tỷ lệ trả trước (%), ví dụ 30" },
            "term": { "type": "NUMBER", "description": "Thời hạn vay (tháng), ví dụ 60" },
            "interestRate": { "type": "NUMBER", "description": "Lãi suất năm (%), ví dụ 8.5" }
          },
          "required": ["price", "downPayment", "term"]
        }
      },
      {
        "name": "createLead",
        "description": "Đăng ký thông tin khách hàng muốn nhận tư vấn hoặc báo giá vào CRM.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "name": { "type": "STRING", "description": "Họ và tên khách hàng" },
            "phone": { "type": "STRING", "description": "Số điện thoại khách hàng" },
            "email": { "type": "STRING", "description": "Email khách hàng" },
            "interestedCar": { "type": "STRING", "description": "ID xe khách hàng quan tâm" },
            "message": { "type": "STRING", "description": "Nội dung yêu cầu cụ thể" }
          },
          "required": ["name", "phone"]
        }
      },
      {
        "name": "createAppointment",
        "description": "Đặt lịch hẹn xem xe và lái thử trực tiếp tại showroom.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "carId": { "type": "STRING", "description": "ID xe muốn xem" },
            "customerName": { "type": "STRING", "description": "Họ tên khách hàng" },
            "phone": { "type": "STRING", "description": "Số điện thoại" },
            "email": { "type": "STRING", "description": "Địa chỉ email" },
            "date": { "type": "STRING", "description": "Ngày giờ hẹn định dạng ISO, ví dụ 2026-06-10T09:00:00Z" },
            "note": { "type": "STRING", "description": "Ghi chú thêm" }
          },
          "required": ["carId", "customerName", "phone", "email", "date"]
        }
      },
      {
        "name": "getCarDetails",
        "description": "Lấy thông tin chi tiết (giá cả, thông số kỹ thuật, hình ảnh) của một xe cụ thể theo ID.",
        "parameters": {
          "type": "OBJECT",
          "properties": {
            "carId": { "type": "STRING", "description": "ID xe cần xem chi tiết" }
          },
          "required": ["carId"]
        }
      },
      {
        "name": "getAvailableCars",
        "description": "Lấy danh sách toàn bộ các xe đang có mặt tại showroom (đang bán hoặc giữ chỗ) cùng ID và giá bán.",
        "parameters": {}
      }
    ]
  }
];

const SYSTEM_PROMPT = `Bạn là AI Sales Assistant (Trợ lý bán hàng thông minh) chuyên nghiệp của Showroom ô tô TQ Auto.
Nhiệm vụ của bạn là tư vấn chọn xe, so sánh thông số, tính toán trả góp và hỗ trợ đặt lịch hẹn xem xe cho khách hàng.

QUY TẮC VỀ DỮ LIỆU & KIẾN THỨC:
1. Đối với kho xe và sản phẩm của Showroom: Bạn phải sử dụng dữ liệu thực tế từ database thông qua các công cụ tìm kiếm được cung cấp (searchCars, getCarDetails, getAvailableCars, v.v.). KHÔNG tự bịa đặt giá bán thực tế, trạng thái tồn kho hoặc thông số kỹ thuật chi tiết của các xe trong showroom. Nếu thông tin xe đó thiếu trong hệ thống, hãy lịch sự đề xuất khách hàng để lại thông tin để nhân viên showroom kiểm tra và liên hệ hỗ trợ.
2. Đối với các câu hỏi kiến thức chung về ô tô: Bạn được phép trả lời linh hoạt, thông minh và giàu thông tin dựa trên kiến thức sâu rộng về ô tô của mình. Ví dụ:
   - Giải thích các thuật ngữ kỹ thuật (Động cơ Hybrid hoạt động ra sao, ADAS là gì, Turbo là gì, phanh ABS hoạt động như thế nào, v.v.).
   - Tư vấn kinh nghiệm chọn xe nói chung (Nên chọn Sedan hay SUV cho gia đình, ưu nhược điểm của xe máy dầu và máy xăng, v.v.).
   - Đánh giá tổng quan về ưu nhược điểm chung của các hãng xe, các phân khúc xe nổi tiếng trên thị trường.
   - Hướng dẫn lái xe an toàn, kinh nghiệm bảo dưỡng xe định kỳ hoặc mẹo chăm sóc ô tô.
3. Luôn cố gắng hỗ trợ khách hàng tìm được chiếc xe phù hợp nhất với tầm tiền và nhu cầu.
4. Cố gắng chuyển đổi các câu hỏi quan tâm ("Tôi muốn tư vấn", "Muốn mua xe", "Báo giá cho tôi") thành cơ hội bán hàng bằng cách xin Tên, Số điện thoại và mẫu xe quan tâm, sau đó gọi công cụ 'createLead' để lưu vào hệ thống CRM.
5. Khi trả lời về giá cả, hãy định dạng số tiền rõ ràng (ví dụ: 1.350.000.000 đ hoặc 1,35 tỷ).
6. Hãy trả lời ngắn gọn, lưu loát, thân thiện và lịch sự bằng tiếng Việt.`;



export interface Appointment {
  appointment_date: string | Date;
  car_title?: string;
}

export interface LoanSimulation {
  car_name?: string;
  term_months: number;
}

export interface ViewedCar {
  title: string;
}

export interface ExecutedTool {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

interface ChatPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: { output: unknown };
  };
}

interface ChatContent {
  role: string;
  parts: ChatPart[];
}

/**
 * Main function to communicate with Gemini API and execute local tool calls.
 */
export async function generateAiChatResponse(
  sessionId: string,
  userMessage: string,
  personalData?: {
    viewedCars?: ViewedCar[];
    loanSimulations?: LoanSimulation[];
    appointments?: Appointment[];
  }
): Promise<{ text: string; executedTools?: ExecutedTool[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: "Xin lỗi quý khách! Chức năng trợ lý AI hiện đang bảo trì do chưa có khóa API (GEMINI_API_KEY). Vui lòng liên hệ Hotline 034 811 5938 để được hỗ trợ trực tiếp."
    };
  }

  // 1. Log the user message in DB
  await addChatMessage(sessionId, "user", userMessage);

  // 2. Fetch history
  const dbMessages = await getSessionMessages(sessionId);

  // 3. Format history for Gemini API
  const contents: ChatContent[] = dbMessages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  // Append personalization context to the first prompt or as a system reminder if user is logged in
  if (personalData) {
    let contextStr = "\n\n[Thông tin cá nhân khách hàng đã đăng nhập]:";
    if (personalData.viewedCars && personalData.viewedCars.length > 0) {
      contextStr += `\n- Các xe vừa xem: ${personalData.viewedCars.map(c => c.title).join(", ")}`;
    }

    if (personalData.loanSimulations && personalData.loanSimulations.length > 0) {
      contextStr += `\n- Lịch sử tính trả góp: ${personalData.loanSimulations.map(l => `${l.car_name} (${l.term_months} tháng)`).join(", ")}`;
    }
    if (personalData.appointments && personalData.appointments.length > 0) {
      contextStr += `\n- Lịch hẹn xem xe: ${personalData.appointments.map(a => `${a.car_title} vào ngày ${new Date(a.appointment_date).toLocaleDateString()}`).join(", ")}`;
    }
    contextStr += "\nHãy chủ động sử dụng thông tin này để tư vấn cá nhân hóa (ví dụ: 'Tôi thấy anh đang quan tâm dòng xe...').";
    
    // Inject context to the last user message
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      const lastPart = contents[contents.length - 1].parts[0];
      if (lastPart && typeof lastPart.text === "string") {
        lastPart.text += contextStr;
      }
    }
  }

  // 4. Send request to Gemini API
  const executedTools: ExecutedTool[] = [];
  let finalResponseText = "";

  try {
    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      tools: SYSTEM_TOOLS,
    };

    let response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let resJson = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error details:", resJson);
      throw new Error(resJson.error?.message || "Lỗi gọi API Gemini");
    }

    let candidate = resJson.candidates?.[0];
    let modelPart = candidate?.content?.parts?.[0];

    // Tool Loop (Supports up to 3 recursive loops if Gemini decides to call multiple tools or follow-ups)
    let loopCount = 0;
    while (modelPart?.functionCall && loopCount < 3) {
      loopCount++;
      const { name, args } = modelPart.functionCall;
      let toolResult: unknown = null;

      // Execute local functions based on name
      try {
        if (name === "searchCars") {
          toolResult = await searchCars(args);
        } else if (name === "compareCars") {
          toolResult = await compareCars(args as { carIds: string[] });
        } else if (name === "recommendCars") {
          toolResult = await recommendCars(args);
        } else if (name === "calculateLoan") {
          toolResult = await calculateLoan(args as { price: number; downPayment: number; term: number; interestRate?: number });
        } else if (name === "createLead") {
          toolResult = await createLead(args as { name: string; phone: string; email?: string; interestedCar?: string; message?: string });
        } else if (name === "createAppointment") {
          toolResult = await createAppointment(args as { carId: string; customerName: string; phone: string; email: string; date: string; note?: string });
        } else if (name === "getCarDetails") {
          toolResult = await getCarDetailById((args as { carId: string }).carId);
        } else if (name === "getAvailableCars") {
          toolResult = await getCarsForRecommendation();
        }
      } catch (err) {
        console.error(`Error executing tool ${name}:`, err);
        toolResult = { error: `Lỗi thực thi tool nội bộ: ${err instanceof Error ? err.message : String(err)}` };
      }

      executedTools.push({ name, args, result: toolResult });

      // Append function call and function response to payload contents for next model call
      contents.push({
        role: "model",
        parts: [{ functionCall: modelPart.functionCall }]
      });

      contents.push({
        role: "function",
        parts: [
          {
            functionResponse: {
              name,
              response: { output: toolResult }
            }
          }
        ]
      });

      // Request next candidate response from Gemini with the tool outputs
      response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          tools: SYSTEM_TOOLS,
        })
      });

      resJson = await response.json();
      candidate = resJson.candidates?.[0];
      modelPart = candidate?.content?.parts?.[0];
    }

    finalResponseText = modelPart?.text || "Tôi có thể giúp gì thêm cho quý khách?";

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Gemini flow error:", err);
    finalResponseText = `Xin lỗi quý khách, hệ thống AI gặp sự cố kỹ thuật khi xử lý thông tin (${errorMsg}). Quý khách có thể thử lại hoặc liên hệ hotline showroom.`;
  }

  // 5. Save the AI model response in DB
  await addChatMessage(sessionId, "model", finalResponseText);

  return {
    text: finalResponseText,
    executedTools
  };
}
