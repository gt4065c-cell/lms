// 우송대학교 전체 학과 목록 및 설정 (2025학년도 입시요강 기준)
// 각 학과 조교가 자신의 학과 비밀번호를 설정할 수 있습니다.

export const DEPARTMENTS = [
  // 솔브릿지 국제경영대학
  { id: "solbridge", name: "솔브릿지경영학부", password: "1230", college: "솔브릿지국제경영대학" },
  
  // 엔디컷 국제대학
  { id: "global_convergence_biz", name: "글로벌융합비즈니스학과", password: "", college: "엔디컷국제대학" },
  { id: "business_major", name: "융합경영학부 경영학전공", password: "", college: "엔디컷국제대학" },
  { id: "endicott_free", name: "자유전공학부 Endicott자유전공", password: "", college: "엔디컷국제대학" },
  { id: "self_design", name: "자유전공학부 자기설계전공", password: "", college: "엔디컷국제대학" },
  { id: "ai_bigdata", name: "AI·빅데이터학과", password: "", college: "엔디컷국제대학" },
  { id: "global_hotel", name: "글로벌호텔매니지먼트학과", password: "", college: "엔디컷국제대학" },
  
  // 철도물류대학
  { id: "global_railway", name: "글로벌철도학과", password: "", college: "철도물류대학" },
  { id: "railway_construction", name: "철도건설시스템학부 철도건설시스템전공", password: "", college: "철도물류대학" },
  { id: "architecture", name: "철도건설시스템학부 건축공학전공", password: "", college: "철도물류대학" },
  { id: "railway_management", name: "철도경영학과", password: "", college: "철도물류대학" },
  { id: "logistics", name: "물류시스템학과", password: "", college: "철도물류대학" },
  { id: "railway_electric", name: "철도시스템학부 철도전기시스템전공", password: "", college: "철도물류대학" },
  { id: "railway_software", name: "철도시스템학부 철도소프트웨어전공", password: "", college: "철도물류대학" },
  { id: "railway_vehicle", name: "철도차량시스템학과", password: "", college: "철도물류대학" },
  
  // 소프트웨어(SW)융합대학
  { id: "global_media", name: "글로벌미디어영상학과", password: "", college: "소프트웨어융합대학" },
  { id: "game_multimedia", name: "테크노미디어융합학부 게임멀티미디어전공", password: "", college: "소프트웨어융합대학" },
  { id: "media_design", name: "테크노미디어융합학부 미디어디자인·영상전공", password: "", college: "소프트웨어융합대학" },
  { id: "computer_eng", name: "소프트웨어학부 컴퓨터공학전공", password: "", college: "소프트웨어융합대학" },
  { id: "computer_sw", name: "소프트웨어학부 컴퓨터·소프트웨어전공", password: "", college: "소프트웨어융합대학" },
  
  // 호텔외식조리대학
  { id: "global_culinary", name: "글로벌조리학부 글로벌조리전공", password: "", college: "호텔외식조리대학" },
  { id: "lyfe_culinary", name: "글로벌조리학부 Lyfe조리전공", password: "", college: "호텔외식조리대학" },
  { id: "global_foodservice", name: "글로벌조리학부 글로벌외식창업전공", password: "", college: "호텔외식조리대학" },
  { id: "foodservice_culinary", name: "외식조리학부 외식조리전공", password: "", college: "호텔외식조리대학" },
  { id: "korean_culinary", name: "외식조리학부 한식·조리과학전공", password: "", college: "호텔외식조리대학" },
  { id: "foodservice_management", name: "외식조리학부 외식,조리경영전공", password: "", college: "호텔외식조리대학" },
  { id: "baking", name: "외식조리학부 제과제빵·조리전공", password: "", college: "호텔외식조리대학" },
  { id: "foodservice_nutrition", name: "외식조리영양학과", password: "", college: "호텔외식조리대학" },
  { id: "hotel_tourism", name: "호텔관광경영학과", password: "", college: "호텔외식조리대학" },
  
  // 보건복지대학
  { id: "social_welfare", name: "사회복지학과", password: "", college: "보건복지대학" },
  { id: "occupational_therapy", name: "작업치료학과", password: "", college: "보건복지대학" },
  { id: "speech_therapy", name: "언어치료·청각재활학과", password: "", college: "보건복지대학" },
  { id: "healthcare_management", name: "보건의료경영학과", password: "", college: "보건복지대학" },
  { id: "early_childhood", name: "유아교육과", password: "", college: "보건복지대학" },
  { id: "beauty_design", name: "뷰티디자인경영학과", password: "", college: "보건복지대학" },
  { id: "emergency_medical", name: "응급구조학과", password: "", college: "보건복지대학" },
  { id: "fire_safety_major", name: "소방·안전학부 소방방재전공", password: "", college: "보건복지대학" },
  { id: "safety_eng_major", name: "소방·안전학부 안전공학전공", password: "", college: "보건복지대학" },
  { id: "nursing", name: "간호학과", password: "", college: "보건복지대학" },
  { id: "physical_therapy", name: "물리치료학과", password: "", college: "보건복지대학" },
  { id: "sports_health", name: "스포츠건강재활학과", password: "", college: "보건복지대학" },
  { id: "animal_medical", name: "동물의료관리학과", password: "", college: "보건복지대학" },
  
  // 교양/공통
  { id: "liberal_arts", name: "교양/공통", password: "", college: "교양" }
];

// 학과 ID로 학과 정보 찾기
export const getDepartmentById = (id) => {
  return DEPARTMENTS.find(dept => dept.id === id);
};

// 학과 이름으로 학과 정보 찾기
export const getDepartmentByName = (name) => {
  return DEPARTMENTS.find(dept => dept.name === name);
};

// 비밀번호 확인
export const verifyDepartmentPassword = (deptId, inputPassword) => {
  const dept = getDepartmentById(deptId);
  if (!dept) return false;
  
  // 비밀번호가 설정되지 않은 경우 (빈 문자열)
  if (dept.password === "") {
    return inputPassword === "0000"; // 기본 비밀번호
  }
  
  return dept.password === inputPassword;
};
