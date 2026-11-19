import { jsPDF } from 'jspdf';
import { OrdemServico } from '../types/os';
import {
  calcularSubtotalItem,
  calcularTotalOS,
  formatarMoeda,
} from './formatters';

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}

async function prepareLogoDataUrl(logoUrl: string): Promise<string | null> {
  try {
    const img = await loadImageElement(logoUrl);
    const canvas = document.createElement('canvas');
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

async function prepareDarkSignatureDataUrl(
  signatureDataUrl: string
): Promise<string | null> {
  try {
    const img = await loadImageElement(signatureDataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 400;
    canvas.height = img.height || 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) {
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function gerarPdfOS(
  os: OrdemServico,
  logoUrl?: string | null,
  isAdmin = true
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Faixa superior institucional
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 4.5, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(pageWidth * 0.45, 0, pageWidth * 0.55, 4.5, 'F');

  y = 14;

  // Bloco direito (Documento Nº / Emissão / Status)
  const docCardW = 52;
  const docCardX = pageWidth - margin - docCardW;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(docCardX, y - 2, docCardW, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('DOCUMENTO Nº', docCardX + docCardW - 3.5, y + 2.5, { align: 'right' });

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(os.id, docCardX + docCardW - 3.5, y + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${os.data}`, docCardX + docCardW - 3.5, y + 12, {
    align: 'right',
  });
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${os.status}`, docCardX + docCardW - 3.5, y + 15.8, {
    align: 'right',
  });

  // Bloco esquerdo (Logo + Título da empresa)
  let textStartX = margin;
  if (logoUrl) {
    const logoPng = await prepareLogoDataUrl(logoUrl);
    if (logoPng) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y - 2, 16, 16, 2, 2, 'FD');
      doc.addImage(logoPng, 'PNG', margin + 1.5, y - 0.5, 13, 13);
      textStartX = margin + 19.5;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(29, 78, 216);
  doc.text('ORDEM DE SERVIÇO TÉCNICA', textStartX, y + 2);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Segurança no Preço Certo', textStartX, y + 7.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Sistemas de Segurança Eletrônica & Manutenção',
    textStartX,
    y + 12.8
  );

  y += 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Dados do cliente
  const clienteLines = doc.splitTextToSize(os.cliente || '-', contentWidth - 8);
  const enderecoLines = doc.splitTextToSize(
    os.endereco || 'Não informado',
    isAdmin ? contentWidth / 2 - 6 : contentWidth - 8
  );
  const boxHeight =
    26 + Math.max(0, clienteLines.length - 1) * 4.5 + Math.max(0, enderecoLines.length - 1) * 4.5;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  let boxY = y + 5;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Cliente / Condomínio', margin + 4, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clienteLines, margin + 4, boxY + 4);
  boxY += 5.5 + clienteLines.length * 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Endereço / Local', margin + 4, boxY);
  if (isAdmin) {
    doc.text('Telefone / WhatsApp', margin + contentWidth / 2 + 2, boxY);
  }

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(enderecoLines, margin + 4, boxY + 4);
  if (isAdmin) {
    doc.text(
      os.telefone || 'Não informado',
      margin + contentWidth / 2 + 2,
      boxY + 4
    );
  }
  boxY += 5.5 + enderecoLines.length * 4.2;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subsistema', margin + 4, boxY);
  doc.text('Técnico Responsável', margin + contentWidth / 2 + 2, boxY);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(os.subsistema, margin + 4, boxY + 4);
  doc.text(os.tecnico, margin + contentWidth / 2 + 2, boxY + 4);

  y += boxHeight + 7;

  // Descrição
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Defeito relatado e serviço executado', margin, y);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const descLines = doc.splitTextToSize(
    os.descricao || '-',
    contentWidth - 8
  );
  const descBoxH = Math.max(12, descLines.length * 4.6 + 6);
  ensureSpace(descBoxH + 8);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, descBoxH, 2, 2, 'S');
  doc.text(descLines, margin + 4, y + 5.5);
  y += descBoxH + 4;

  if (os.observacoes) {
    const obsLines = doc.splitTextToSize(
      `Observações técnicas: ${os.observacoes}`,
      contentWidth
    );
    ensureSpace(obsLines.length * 4.2 + 4);
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(obsLines, margin, y + 1);
    y += obsLines.length * 4.2 + 4;
  } else {
    y += 2;
  }

  // Tabela de itens
  ensureSpace(24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Discriminação de peças e mão de obra', margin, y);
  y += 3;

  const colNumW = 9;
  const colDescX = margin + colNumW;
  const colDescW = contentWidth - 68 - colNumW;
  const colQtdX = colDescX + colDescW;
  const colUnitX = colQtdX + 18;
  const colSubX = colUnitX + 25;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('#', margin + 4.5, y + 5.2, { align: 'center' });
  doc.text('Descrição', colDescX + 2, y + 5.2);
  doc.text('Qtd', colQtdX + 15, y + 5.2, { align: 'right' });
  doc.text('Unitário', colUnitX + 22, y + 5.2, { align: 'right' });
  doc.text('Subtotal', colSubX + 22, y + 5.2, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  if (os.itens.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 9, 'S');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum item lançado nesta O.S.', pageWidth / 2, y + 5.8, {
      align: 'center',
    });
    y += 9;
  } else {
    for (let idx = 0; idx < os.itens.length; idx++) {
      const item = os.itens[idx];
      const itemDescLines = doc.splitTextToSize(
        item.desc || '-',
        colDescW - 5
      );
      const rowH = Math.max(8, itemDescLines.length * 4.3 + 3.5);
      ensureSpace(rowH + 10);

      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowH, 'S');

      doc.setTextColor(100, 116, 139);
      doc.text(`${idx + 1}`, margin + 4.5, y + 5, { align: 'center' });
      doc.setTextColor(15, 23, 42);
      doc.text(itemDescLines, colDescX + 2, y + 5);
      doc.text(`${item.qtd} Un`, colQtdX + 15, y + 5, { align: 'right' });
      doc.text(formatarMoeda(item.valor), colUnitX + 22, y + 5, {
        align: 'right',
      });
      doc.setFont('helvetica', 'bold');
      doc.text(
        formatarMoeda(calcularSubtotalItem(item)),
        colSubX + 22,
        y + 5,
        { align: 'right' }
      );
      doc.setFont('helvetica', 'normal');
      y += rowH;
    }
  }

  const total = calcularTotalOS(os);
  ensureSpace(12);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 9, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Total da Ordem de Serviço', colSubX - 3, y + 6, {
    align: 'right',
  });
  doc.text(formatarMoeda(total), colSubX + 22, y + 6, { align: 'right' });
  y += 18;

  // Assinaturas
  ensureSpace(30);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const sigWidth = (contentWidth - 14) / 2;
  const sigRightX = margin + sigWidth + 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(os.tecnico, margin, y + 4);
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y + 6, margin + sigWidth, y + 6);
  doc.setFontSize(7.5);
  doc.text('Responsável Técnico', margin, y + 10);

  if (os.assinatura) {
    const darkSig = await prepareDarkSignatureDataUrl(os.assinatura);
    if (darkSig) {
      doc.addImage(darkSig, 'PNG', sigRightX + 6, y - 10, sigWidth - 12, 15);
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Sem assinatura', sigRightX + sigWidth / 2, y + 2, {
      align: 'center',
    });
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(sigRightX, y + 6, sigRightX + sigWidth, y + 6);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do Cliente / Síndico', sigRightX, y + 10);

  doc.save(`${os.id}.pdf`);
}
