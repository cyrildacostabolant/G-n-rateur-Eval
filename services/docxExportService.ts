import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, Footer, PageNumber } from "docx";
import { Evaluation, Category } from "../types.ts";

export const exportToDocx = async (evaluation: Evaluation, categories: Category[], showAnswers: boolean) => {
  const category = categories.find(c => c.id === evaluation.categoryId);
  const catColor = (category?.color || "#000000").replace("#", "");

  const sections: { [key: string]: any[] } = {};
  evaluation.questions.forEach((q, index) => {
    const section = q.sectionTitle || "Sans Titre";
    if (!sections[section]) sections[section] = [];
    sections[section].push({ ...q, number: index + 1 });
  });

  // Création du document
  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.BOTH,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: "auto" } },
                children: [
                  new TextRun({ text: `${evaluation.title.toUpperCase()} | ${category?.name || "Général"}`, size: 18, color: "999999" }),
                  new TextRun({ text: "\tPage ", size: 18, color: "999999" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Table d'en-tête (Date | Titre)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Date", bold: true, underline: {} })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ".... / .... / ...." })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    shading: { fill: catColor },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: evaluation.title.toUpperCase(), bold: true, color: "FFFFFF", size: 32 })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Table Commentaire | Note
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Commentaire", italic: true, underline: {} })] }),
                      new Paragraph({ children: [new TextRun({ text: evaluation.comment || "...", italic: true, color: "666666" })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "__________", bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${evaluation.totalPoints}`, bold: true, size: 36 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Contenu Questions
          ...Object.entries(sections).flatMap(([title, qs]) => {
            const totalSectionPoints = qs.reduce((acc, q) => acc + (q.points || 0), 0);
            return [
              new Paragraph({
                children: [
                  new TextRun({ text: `${title.toUpperCase()} (${totalSectionPoints} pts)`, bold: true, color: "C00000", underline: {} }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              ...qs.flatMap((q) => {
                const qElements = [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${q.number}. (${q.points} pts)`, bold: true, color: "0070C0" }),
                    ],
                    spacing: { before: 200 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: `◦ ${q.content}` })],
                    indent: { left: 360 },
                  }),
                ];

                if (showAnswers && q.answer) {
                  // Nettoyage sommaire de l'HTML pour le Word
                  const plainAnswer = q.answer.replace(/<[^>]*>?/gm, '');
                  qElements.push(
                    new Paragraph({
                      children: [new TextRun({ text: `R: ${plainAnswer}`, italic: true, color: "555555" })],
                      indent: { left: 720 },
                      spacing: { before: 100 },
                    })
                  );
                } else {
                  // Lignes de réponse pour l'élève
                  for (let i = 0; i < 3; i++) {
                    qElements.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } }, spacing: { before: 100 } }));
                  }
                }

                return qElements;
              }),
            ];
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${evaluation.title.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};