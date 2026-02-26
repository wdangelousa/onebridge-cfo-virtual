import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from './supabase';

export const generateAndUploadPDF = async (
    elementId: string,
    filename: string,
    transactionId?: string
): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element not found:", elementId);
        return null;
    }

    try {
        // 1. Capture HTML to Canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        // 2. Create PDF (A4 format: 210mm x 297mm)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');

        // 3. Upload to Supabase Storage
        const filePath = `documents/${Date.now()}_${filename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('official_documents')
            .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('official_documents')
            .getPublicUrl(filePath);

        // 5. Update Transaction Record (if ID provided)
        if (transactionId && transactionId !== 'manual') {
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ document_url: publicUrl })
                .eq('id', transactionId);

            if (updateError) console.error("Error updating transaction with PDF URL:", updateError);
        }

        return publicUrl;
    } catch (error) {
        console.error("Error in PDF generation/upload:", error);
        throw error;
    }
};
