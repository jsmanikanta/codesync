export const LANGUAGE_CONFIG = {
  javascript: {
    label: "JavaScript",
    editorMode: { name: "javascript", json: true },
    starterCode: 'console.log("Hello CodeSync");',
  },
  python: {
    label: "Python",
    editorMode: "python",
    starterCode: 'print("Hello CodeSync")',
  },
  cpp: {
    label: "C++",
    editorMode: "text/x-c++src",
    starterCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello CodeSync";\n    return 0;\n}',
  },
  java: {
    label: "Java",
    editorMode: "text/x-java",
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeSync");\n    }\n}',
  },
  c: {
    label: "C",
    editorMode: "text/x-csrc",
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello CodeSync");\n    return 0;\n}',
  },
};

export const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_CONFIG).map(
  ([value, config]) => ({ value, label: config.label }),
);
