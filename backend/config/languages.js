export const LANGUAGE_CONFIG = {
  javascript: {
    label: "JavaScript",
    editorMode: "javascript",
    executionLanguage: "javascript",
    judge0LanguageId: 63,
    starterCode: 'console.log("Hello CodeSync");',
  },
  python: {
    label: "Python",
    editorMode: "python",
    executionLanguage: "python",
    judge0LanguageId: 71,
    starterCode: 'print("Hello CodeSync")',
  },
  cpp: {
    label: "C++",
    editorMode: "clike",
    executionLanguage: "cpp",
    judge0LanguageId: 54,
    starterCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello CodeSync";\n    return 0;\n}',
  },
  java: {
    label: "Java",
    editorMode: "clike",
    executionLanguage: "java",
    judge0LanguageId: 62,
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeSync");\n    }\n}',
  },
  c: {
    label: "C",
    editorMode: "clike",
    executionLanguage: "c",
    judge0LanguageId: 50,
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello CodeSync");\n    return 0;\n}',
  },
};

export const getLanguageConfig = (language) => LANGUAGE_CONFIG[language];
