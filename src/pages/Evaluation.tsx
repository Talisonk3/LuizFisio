"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  User, 
  ClipboardList, 
  Activity, 
  Dumbbell, 
  Save, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Plus,
  Trash2,
  ArrowLeft,
  FileText,
  History,
  Home
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import CustomSelect from '@/components/CustomSelect';
import NotificationModal, { ModalType } from '@/components/NotificationModal';
import EvolutionHistoryTab from '@/components/EvolutionHistoryTab';

const fieldLabels: Record<string, string> = {
  patient_name: 'Nome',
  birth_date: 'Data de Nasc.',
  email: 'E-mail',
  phone: 'Telefone',
  address: 'Endereço',
  marital_status: 'Est. Civil',
  gender: 'Gênero',
  profession: 'Profissão',
  weight: 'Peso',
  height: 'Altura',
  caregiver_name: 'Cuidador',
  caregiver_phone: 'Tel. Cuidador',
  responsible_doctor: 'Médico',
  doctor_phone: 'Tel. Médico',
  chief_complaint: 'Queixa',
  history_present_illness: 'HDA',
  previous_illness_history: 'HDP',
  family_history: 'Hist. Familiar',
  drinks_details: 'Álcool',
  smokes_details: 'Fumo',
  sedentary_details: 'Ativ. Física',
  medications: 'Medicamentos',
  previous_surgeries: 'Cirurgias',
  pain_scale: 'Dor (EVA)',
  pain_worsening_factors: 'Piora dor',
  pain_improvement_factors: 'Melhora dor',
  blood_pressure: 'PA',
  heart_rate: 'FC',
  respiratory_rate: 'FR',
  temperature: 'Temp',
  saturation: 'SatO2',
  cardiac_auscultation: 'Ausc. Cardíaca',
  pulmonary_auscultation: 'Ausc. Pulmonar',
  auditory_alteration_details: 'Alt. Auditiva',
  visual_alteration_details: 'Alt. Visual',
  gait_aid_details: 'Aux. Marcha',
  inspection_palpation: 'Inspeção',
  range_of_motion: 'ADM',
  muscle_strength: 'Força',
  muscle_tone_mmss: 'Tônus MMSS',
  muscle_tone_mmii: 'Tônus MMII',
  physio_diagnosis: 'Diagnóstico',
  complementary_exams_details: 'Exames Compl.'
};

const Evaluation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('mode') === 'view';
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('identificacao');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [errors, setErrors] = useState<string[]>([]);
  const [examFiles, setExamFiles] = useState<string[]>([]);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  const [admRows, setAdmRows] = useState([{ movement: '', degree: '' }]);
  const [originalData, setOriginalData] = useState<any>(null);
  const [originalAdmRows, setOriginalAdmRows] = useState<any>([]);
  const [originalFiles, setOriginalFiles] = useState<string[]>([]);

  const initialFormData = {
    patient_name: '',
    birth_date: '',
    email: '',
    phone: '',
    address: '',
    address_number: '',
    marital_status: '',
    gender: '',
    profession: '',
    weight: '',
    height: '',
    has_caregiver: 'Não',
    caregiver_name: '',
    caregiver_phone: '',
    responsible_doctor: '',
    doctor_phone: '',
    evaluation_date: new Date().toLocaleDateString('pt-BR'),
    chief_complaint: '',
    history_present_illness: '',
    previous_illness_history: '',
    family_history: '',
    drinks: 'Não',
    drinks_details: '',
    smokes: 'Não',
    smokes_details: '',
    sedentary: 'Não',
    sedentary_details: '',
    has_medications: 'Não',
    medications: '',
    has_surgeries: 'Não',
    previous_surgeries: '',
    pain_scale: '0',
    pain_worsening_factors: '',
    pain_improvement_factors: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    saturation: '',
    cardiac_auscultation: '',
    pulmonary_auscultation: '',
    auditory_alteration: 'Não',
    auditory_alteration_details: '',
    visual_alteration: 'Não',
    visual_alteration_details: '',
    gait_aid: 'Não',
    gait_aid_details: '',
    inspection_palpation: '',
    range_of_motion: '',
    muscle_strength: '',
    muscle_tone_mmss: 'Normal',
    muscle_tone_mmii: 'Normal',
    physio_diagnosis: '',
    has_complementary_exams: 'Não',
    complementary_exams_details: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          let street = data.address || '';
          let number = '';
          if (street.includes(',')) {
            const parts = street.split(',');
            street = parts[0].trim();
            number = parts[1].trim();
          }

          let birthDate = '';
          if (data.birth_date) {
            const parts = data.birth_date.split('-');
            birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            const dateParts = data.birth_date.split('-');
            birthDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          }

          let rows = [{ movement: '', degree: '' }];
          if (data.range_of_motion) {
            rows = data.range_of_motion.split('; ').map((item: string) => {
              const [movement, degree] = item.split(': ');
              return { movement: movement || '', degree: degree || '' };
            });
          }

          const loadedData = {
            ...initialFormData,
            ...data,
            address: street,
            address_number: number,
            birth_date: birthDate,
            has_caregiver: data.caregiver_name ? 'Sim' : 'Não',
            has_medications: data.medications ? 'Sim' : 'Não',
            has_surgeries: data.previous_surgeries ? 'Sim' : 'Não',
            drinks: data.drinks_details ? 'Sim' : 'Não',
            smokes: data.smokes_details ? 'Sim' : 'Não',
            sedentary: data.sedentary_details ? 'Sim' : 'Não',
            auditory_alteration: data.auditory_alteration_details ? 'Sim' : 'Não',
            visual_alteration: data.visual_alteration_details ? 'Sim' : 'Não',
            gait_aid: data.gait_aid_details ? 'Sim' : 'Não',
            has_complementary_exams: data.complementary_exams_details ? 'Sim' : 'Não',
            evaluation_date: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : initialFormData.evaluation_date
          };

          setFormData(loadedData);
          setOriginalData(JSON.parse(JSON.stringify(loadedData)));
          setAdmRows(rows);
          setOriginalAdmRows(JSON.parse(JSON.stringify(rows)));
        }
      } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
        showAlert('error', 'Erro', 'Não foi possível carregar os dados desta avaliação.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);

  const isFormDirty = useMemo(() => {
    if (isViewMode) return false;
    
    if (!id) {
      return Object.keys(formData).some(key => {
        if (key === 'evaluation_date') return false;
        const val = formData[key as keyof typeof formData];
        return val !== initialFormData[key as keyof typeof initialFormData];
      });
    }

    if (!originalData) return false;

    const hasFormDataChanges = Object.keys(formData).some(key => {
      if (key === 'evaluation_date') return false;
      return formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData];
    });

    const hasAdmChanges = JSON.stringify(admRows) !== JSON.stringify(originalAdmRows);
    const hasFilesChanges = examFiles.length !== originalFiles.length;

    return hasFormDataChanges || hasAdmChanges || hasFilesChanges;
  }, [formData, admRows, examFiles, originalData, originalAdmRows, originalFiles, id, isViewMode]);

  const showAlert = (type: ModalType, title: string, message: string, onConfirm?: () => void, confirmLabel?: string, cancelLabel?: string) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmLabel,
      cancelLabel
    });
  };

  const handleGoHome = () => {
    if (isFormDirty) {
      showAlert(
        'warning', 
        'Ficha não salva!', 
        'Você preencheu alguns dados nesta avaliação. Se sair agora, todas as informações não salvas serão perdidas. Deseja realmente voltar ao início?',
        () => navigate('/'),
        'Sim, sair agora',
        'Não, continuar'
      );
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    if (isFormDirty) {
      showAlert(
        'warning', 
        'Alterações não salvas!', 
        'Existem alterações nesta ficha que ainda não foram salvas. Deseja realmente voltar para a lista de pacientes?',
        () => navigate('/pacientes'),
        'Sim, sair sem salvar',
        'Não, continuar editando'
      );
    } else {
      navigate('/pacientes');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const currentYear = new Date().getFullYear();
    let day = numbers.slice(0, 2);
    let month = numbers.slice(2, 4);
    let year = numbers.slice(4, 8);
    if (day && parseInt(day) > 31) day = '31';
    if (day && day !== '0' && day !== '00' && parseInt(day) === 0) day = '01';
    if (month && parseInt(month) > 12) month = '12';
    if (month && month !== '0' && month !== '00' && parseInt(month) === 0) month = '01';
    if (year && year.length === 4 && parseInt(year) > currentYear) year = currentYear.toString();
    if (numbers.length <= 2) return day;
    if (numbers.length <= 4) return `${day}/${month}`;
    return `${day}/${month}/${year}`;
  };

  const formatHeight = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 3);
    if (numbers.length <= 1) return numbers;
    if (numbers.length === 2) return `${numbers.slice(0, 1)}.${numbers.slice(1)}`;
    return `${numbers.slice(0, 1)}.${numbers.slice(1, 3)}`;
  };

  const formatPA = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 5);
    if (numbers.length <= 2) return numbers;
    if (numbers.length === 3) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    if (numbers.length === 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 3)}/${numbers.slice(3)}`;
  };

  const formatTemp = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 3);
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (isViewMode) return;
    const { name, value } = e.target;
    let filteredValue = value.trimStart();
    
    if (name === 'patient_name' || name === 'responsible_doctor' || name === 'caregiver_name') {
      filteredValue = filteredValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (name === 'profession') {
      filteredValue = filteredValue.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (name === 'address') {
      filteredValue = filteredValue.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '');
    } else if (name === 'weight') {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'height') {
      filteredValue = formatHeight(filteredValue);
    } else if (name === 'phone' || name === 'doctor_phone' || name === 'caregiver_phone') {
      filteredValue = formatPhone(filteredValue);
    } else if (name === 'birth_date' || name === 'evaluation_date') {
      filteredValue = formatDate(filteredValue);
    } else if (name === 'blood_pressure') {
      filteredValue = formatPA(filteredValue);
    } else if (name === 'heart_rate') {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'respiratory_rate') {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 2);
    } else if (name === 'temperature') {
      filteredValue = formatTemp(filteredValue);
    } else if (name === 'saturation') {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'address_number') {
      filteredValue = filteredValue.replace(/\D/g, '').substring(0, 6);
    }

    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (isViewMode) return;
    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdmRowChange = (index: number, field: 'movement' | 'degree', value: string) => {
    if (isViewMode) return;
    const newRows = [...admRows];
    let filteredValue = value;
    if (field === 'movement') {
      filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'degree') {
      const numbers = value.replace(/\D/g, '').substring(0, 3);
      filteredValue = numbers ? `${numbers}°` : '';
    }
    newRows[index][field] = filteredValue;
    setAdmRows(newRows);
  };

  const addAdmRow = () => {
    if (isViewMode) return;
    setAdmRows([...admRows, { movement: '', degree: '' }]);
  };

  const removeAdmRow = (index: number) => {
    if (isViewMode) return;
    if (admRows.length > 1) {
      setAdmRows(admRows.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    const files = Array.from(e.target.files || []);
    if (examFiles.length + files.length > 10) {
      showAlert('warning', 'Limite de Arquivos', 'Você pode enviar no máximo 10 arquivos.');
      return;
    }
    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        showAlert('error', 'Arquivo Inválido', 'Apenas imagens e arquivos PDF são permitidos.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setExamFiles(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    if (isViewMode) return;
    setExamFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateCurrentTab = () => {
    const newErrors: string[] = [];
    
    if (activeTab === 'identificacao') {
      const requiredFields = [
        'patient_name', 
        'birth_date', 
        'gender', 
        'marital_status', 
        'address', 
        'address_number',
        'profession'
      ];
      if (formData.has_caregiver === 'Sim') {
        requiredFields.push('caregiver_name', 'caregiver_phone');
      }
      requiredFields.forEach(field => {
        const val = formData[field as keyof typeof formData];
        if (!val || val.toString().trim() === '') {
          newErrors.push(field);
        }
      });
      if (formData.birth_date.length < 10 && !newErrors.includes('birth_date')) {
        newErrors.push('birth_date');
      }
    }
    
    if (activeTab === 'exame-fisico') {
      if (formData.auditory_alteration === 'Sim' && !formData.auditory_alteration_details.trim()) newErrors.push('auditory_alteration_details');
      if (formData.visual_alteration === 'Sim' && !formData.visual_alteration_details.trim()) newErrors.push('visual_alteration_details');
      if (formData.gait_aid === 'Sim' && !formData.gait_aid_details.trim()) newErrors.push('gait_aid_details');
      if (formData.has_complementary_exams === 'Sim' && !formData.complementary_exams_details.trim()) newErrors.push('complementary_exams_details');
    }
    
    if (activeTab === 'anamnese') {
      if (formData.drinks === 'Sim' && !formData.drinks_details.trim()) newErrors.push('drinks_details');
      if (formData.smokes === 'Sim' && !formData.smokes_details.trim()) newErrors.push('smokes_details');
      if (formData.sedentary === 'Sim' && !formData.sedentary_details.trim()) newErrors.push('sedentary_details');
      if (formData.has_medications === 'Sim' && !formData.medications.trim()) newErrors.push('medications');
      if (formData.has_surgeries === 'Sim' && !formData.previous_surgeries.trim()) newErrors.push('previous_surgeries');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateAll = () => {
    const newErrors: string[] = [];
    
    // Identificacao
    const idFields = ['patient_name', 'birth_date', 'gender', 'marital_status', 'address', 'address_number', 'profession'];
    if (formData.has_caregiver === 'Sim') idFields.push('caregiver_name', 'caregiver_phone');
    idFields.forEach(f => { if (!formData[f as keyof typeof formData]?.toString().trim()) newErrors.push(f); });
    if (formData.birth_date.length < 10 && !newErrors.includes('birth_date')) newErrors.push('birth_date');

    // Exame Fisico
    if (formData.auditory_alteration === 'Sim' && !formData.auditory_alteration_details.trim()) newErrors.push('auditory_alteration_details');
    if (formData.visual_alteration === 'Sim' && !formData.visual_alteration_details.trim()) newErrors.push('visual_alteration_details');
    if (formData.gait_aid === 'Sim' && !formData.gait_aid_details.trim()) newErrors.push('gait_aid_details');
    if (formData.has_complementary_exams === 'Sim' && !formData.complementary_exams_details.trim()) newErrors.push('complementary_exams_details');

    // Anamnese
    if (formData.drinks === 'Sim' && !formData.drinks_details.trim()) newErrors.push('drinks_details');
    if (formData.smokes === 'Sim' && !formData.smokes_details.trim()) newErrors.push('smokes_details');
    if (formData.sedentary === 'Sim' && !formData.sedentary_details.trim()) newErrors.push('sedentary_details');
    if (formData.has_medications === 'Sim' && !formData.medications.trim()) newErrors.push('medications');
    if (formData.has_surgeries === 'Sim' && !formData.previous_surgeries.trim()) newErrors.push('previous_surgeries');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (isViewMode) return;
    if (!validateAll()) {
      showAlert('warning', 'Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios marcados em vermelho antes de salvar.');
      return;
    }

    let formattedBirthDate = null;
    const parts = formData.birth_date.split('/');
    if (parts.length === 3) {
      formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const formattedAdm = admRows
      .filter(row => row.movement.trim() || row.degree.trim())
      .map(row => `${row.movement}: ${row.degree}`)
      .join('; ');

    setIsSaving(true);
    try {
      const fullAddress = `${formData.address}, ${formData.address_number}`;
      
      const { 
        has_medications, 
        has_surgeries, 
        has_caregiver, 
        has_complementary_exams,
        address_number,
        evaluation_date,
        drinks,
        smokes,
        sedentary,
        auditory_alteration,
        visual_alteration,
        gait_aid,
        id: recordId,
        created_at,
        ...dataToSave 
      } = formData;

      const payload = { 
        ...dataToSave, 
        address: fullAddress,
        birth_date: formattedBirthDate,
        user_id: user?.id,
        range_of_motion: formattedAdm,
        medications: has_medications === 'Sim' ? formData.medications : '',
        previous_surgeries: has_surgeries === 'Sim' ? formData.previous_surgeries : '',
        caregiver_name: has_caregiver === 'Sim' ? formData.caregiver_name : '',
        caregiver_phone: has_caregiver === 'Sim' ? formData.caregiver_phone : '',
        drinks_details: formData.drinks === 'Sim' ? formData.drinks_details : '',
        smokes_details: formData.smokes === 'Sim' ? formData.smokes_details : '',
        sedentary_details: formData.sedentary === 'Sim' ? formData.sedentary_details : '',
      };

      let actionDescription = '';
      if (!id) {
        actionDescription = 'Ficha de avaliação inicial criada.';
      } else {
        const changes = [];
        for (const key in payload) {
          if (payload[key] !== originalData[key] && fieldLabels[key]) {
            const oldValue = originalData[key] || 'Vazio';
            const newValue = payload[key] || 'Vazio';
            changes.push(`[${fieldLabels[key]}: ${oldValue} → ${newValue}]`);
          }
        }
        actionDescription = changes.length > 0 
          ? `Campos atualizados: ${changes.join(' ')}` 
          : 'Ficha salva sem alterações detectadas.';
      }

      let error;
      let savedId = id;
      if (id) {
        const { error: updateError } = await supabase
          .from('evaluations')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('evaluations')
          .insert([payload])
          .select();
        error = insertError;
        if (insertData) savedId = insertData[0].id;
      }

      if (error) throw error;

      if (savedId) {
        await supabase.from('evaluation_history').insert([{
          evaluation_id: savedId,
          user_id: user?.id,
          action_description: actionDescription
        }]);
      }
      
      showAlert(
        'success', 
        'Sucesso!', 
        id ? 'Ficha atualizada com sucesso!' : 'Avaliação salva com sucesso!',
        () => navigate('/pacientes'),
        'Ver Pacientes',
        id ? 'Continuar Editando' : 'Nova Avaliação'
      );
      
      if (!id) {
        setFormData(initialFormData);
        setAdmRows([{ movement: '', degree: '' }]);
        setExamFiles([]);
        setErrors([]);
        setActiveTab('identificacao');
      } else {
        setOriginalData(JSON.parse(JSON.stringify(formData)));
        setOriginalAdmRows(JSON.parse(JSON.stringify(admRows)));
        setOriginalFiles([...examFiles]);
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showAlert('error', 'Erro ao Salvar', error.message || 'Verifique sua conexão com a internet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (!isViewMode) {
      if (!validateCurrentTab()) {
        showAlert('warning', 'Campos Obrigatórios', 'Preencha os campos obrigatórios marcados em vermelho antes de prosseguir.');
        return;
      }
    }
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else if (!isViewMode) {
      handleSave();
    }
  };

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: User },
    { id: 'exame-fisico', label: 'Sinais e Exames', icon: Activity },
    { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
    { id: 'funcional', label: 'Avaliação Funcional', icon: Dumbbell },
    ...(id ? [{ id: 'historico-evolucoes', label: 'Histórico de Evoluções', icon: History }] : [])
  ];

  const getInputClasses = (fieldName: string) => {
    const base = "w-full p-3 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-slate-300 placeholder:text-slate-400 appearance-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
    const errorState = errors.includes(fieldName) ? "border-red-500 bg-red-50" : "border-slate-200";
    return `${base} ${errorState}`;
  };

  const labelClasses = "text-sm font-semibold text-slate-600 mb-1 block ml-1";

  const getPainColor = (value: number) => {
    if (value === 0) return 'bg-green-500';
    if (value <= 3) return 'bg-yellow-400';
    if (value <= 6) return 'bg-orange-500';
    if (value <= 8) return 'bg-red-500';
    return 'bg-red-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Carregando ficha do paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col items-center">
          <button 
            onClick={handleGoHome}
            className="group flex flex-col items-center transition-all"
          >
            <div className="bg-white border-2 border-slate-100 p-4 rounded-[2rem] shadow-sm group-hover:shadow-md group-hover:border-blue-200 group-hover:scale-105 transition-all duration-300">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                <Activity size={32} strokeWidth={3} />
              </div>
            </div>
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!isViewMode && !validateCurrentTab()) {
                  showAlert('warning', 'Campos Obrigatórios', 'Preencha os campos obrigatórios antes de mudar de aba.');
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon size={22} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => { signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-5 py-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-medium"
          >
            <LogOut size={22} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {isViewMode ? 'Visualizar Ficha' : (id ? 'Editar Ficha' : 'Nova Avaliação')}
              </h1>
              <p className="text-slate-500 mt-1">
                {id ? `${isViewMode ? 'Visualizando' : 'Editando'} dados de ${formData.patient_name}` : 'Preencha os dados clínicos do seu paciente.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleGoHome}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                title="Início"
              >
                <Home size={20} />
              </button>
              <button 
                onClick={handleGoBack}
                className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all font-bold shadow-sm"
              >
                <ArrowLeft size={20} /> Voltar
              </button>
              
              {!isViewMode && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving || !isFormDirty}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none font-bold"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {id ? 'Atualizar Ficha' : 'Salvar Ficha'}
                </button>
              )}
            </div>
          </header>

          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
            {activeTab === 'identificacao' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><User size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Dados de Identificação</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClasses}>Nome Completo <span className="text-red-500">*</span></label>
                    <input disabled={isViewMode} name="patient_name" value={formData.patient_name} onChange={handleInputChange} type="text" className={getInputClasses('patient_name')} placeholder="Ex: João da Silva Santos" />
                  </div>
                  <div>
                    <label className={labelClasses}>Data de Nascimento <span className="text-red-500">*</span></label>
                    <input disabled={isViewMode} name="birth_date" value={formData.birth_date} onChange={handleInputChange} type="text" className={getInputClasses('birth_date')} placeholder="DD/MM/AAAA" maxLength={10} />
                  </div>
                  <div>
                    <label className={labelClasses}>Gênero <span className="text-red-500">*</span></label>
                    <CustomSelect 
                      options={[
                        { value: 'Masculino', label: 'Masculino' },
                        { value: 'Feminino', label: 'Feminino' }
                      ]}
                      value={formData.gender}
                      onChange={(val) => handleSelectChange('gender', val)}
                      error={errors.includes('gender')}
                      disabled={isViewMode}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Estado Civil <span className="text-red-500">*</span></label>
                    <CustomSelect 
                      options={[
                        { value: 'Solteiro(a)', label: 'Solteiro(a)' },
                        { value: 'Casado(a)', label: 'Casado(a)' },
                        { value: 'Divorciado(a)', label: 'Divorciado(a)' },
                        { value: 'Viúvo(a)', label: 'Viúvo(a)' }
                      ]}
                      value={formData.marital_status}
                      onChange={(val) => handleSelectChange('marital_status', val)}
                      error={errors.includes('marital_status')}
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className={labelClasses}>Endereço <span className="text-red-500">*</span></label>
                      <input disabled={isViewMode} name="address" value={formData.address} onChange={handleInputChange} type="text" className={getInputClasses('address')} placeholder="Rua, bairro, cidade" />
                    </div>
                    <div className="col-span-1">
                      <label className={labelClasses}>Nº <span className="text-red-500">*</span></label>
                      <input disabled={isViewMode} name="address_number" value={formData.address_number} onChange={handleInputChange} type="text" className={getInputClasses('address_number')} placeholder="123" maxLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Profissão <span className="text-red-500">*</span></label>
                    <input disabled={isViewMode} name="profession" value={formData.profession} onChange={handleInputChange} type="text" className={getInputClasses('profession')} placeholder="Ex: Engenheiro" />
                  </div>
                  <div>
                    <label className={labelClasses}>Telefone de Contato</label>
                    <input disabled={isViewMode} name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className={getInputClasses('phone')} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                  <div>
                    <label className={labelClasses}>E-mail do Paciente</label>
                    <input disabled={isViewMode} name="email" value={formData.email} onChange={handleInputChange} type="email" className={getInputClasses('email')} placeholder="exemplo@email.com" />
                  </div>
                  <div>
                    <label className={labelClasses}>Peso (kg)</label>
                    <input disabled={isViewMode} name="weight" value={formData.weight} onChange={handleInputChange} type="text" className={getInputClasses('weight')} placeholder="Ex: 75" maxLength={3} />
                  </div>
                  <div>
                    <label className={labelClasses}>Altura (m)</label>
                    <input disabled={isViewMode} name="height" value={formData.height} onChange={handleInputChange} type="text" className={getInputClasses('height')} placeholder="Ex: 1.75" maxLength={4} />
                  </div>

                  <div className="md:col-span-2 space-y-4 border-t border-slate-100 pt-8">
                    <div>
                      <label className={labelClasses}>Possui Familiar Responsável ou Cuidador?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, has_caregiver: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.has_caregiver === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {formData.has_caregiver === 'Sim' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className={labelClasses}>Nome do Responsável <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="caregiver_name" 
                            value={formData.caregiver_name} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('caregiver_name')} 
                            placeholder="Nome completo" 
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>Telefone do Responsável <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="caregiver_phone" 
                            value={formData.caregiver_phone} 
                            onChange={handleInputChange} 
                            type="tel" 
                            className={getInputClasses('caregiver_phone')} 
                            placeholder="(00) 00000-0000" 
                            maxLength={15}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-8 md:col-span-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informações Médicas (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className={labelClasses}>Médico Responsável</label>
                        <input disabled={isViewMode} name="responsible_doctor" value={formData.responsible_doctor} onChange={handleInputChange} type="text" className={getInputClasses('responsible_doctor')} placeholder="Nome do médico" />
                      </div>
                      <div>
                        <label className={labelClasses}>Telefone do Médico</label>
                        <input disabled={isViewMode} name="doctor_phone" value={formData.doctor_phone} onChange={handleInputChange} type="tel" className={getInputClasses('doctor_phone')} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exame-fisico' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Activity size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Sinais Vitais e Exame Físico</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <label className={labelClasses}>PA (mmHg)</label>
                    <input disabled={isViewMode} name="blood_pressure" value={formData.blood_pressure} onChange={handleInputChange} type="text" className={getInputClasses('blood_pressure')} placeholder="120/80" maxLength={6} />
                  </div>
                  <div>
                    <label className={labelClasses}>FC (bpm)</label>
                    <input disabled={isViewMode} name="heart_rate" value={formData.heart_rate} onChange={handleInputChange} type="text" className={getInputClasses('heart_rate')} placeholder="70" maxLength={3} />
                  </div>
                  <div>
                    <label className={labelClasses}>FR (irpm)</label>
                    <input disabled={isViewMode} name="respiratory_rate" value={formData.respiratory_rate} onChange={handleInputChange} type="text" className={getInputClasses('respiratory_rate')} placeholder="16" maxLength={2} />
                  </div>
                  <div>
                    <label className={labelClasses}>Temp (°C)</label>
                    <input disabled={isViewMode} name="temperature" value={formData.temperature} onChange={handleInputChange} type="text" className={getInputClasses('temperature')} placeholder="36.5" maxLength={4} />
                  </div>
                  <div>
                    <label className={labelClasses}>SatO2 (%)</label>
                    <input disabled={isViewMode} name="saturation" value={formData.saturation} onChange={handleInputChange} type="text" className={getInputClasses('saturation')} placeholder="98" maxLength={3} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClasses}>Ausculta Cardíaca</label>
                    <textarea disabled={isViewMode} name="cardiac_auscultation" value={formData.cardiac_auscultation} onChange={handleInputChange} className={`${getInputClasses('cardiac_auscultation')} h-24 resize-none`} placeholder="Bulhas rítmicas, sopros..."></textarea>
                  </div>
                  <div>
                    <label className={labelClasses}>Ausculta Pulmonar</label>
                    <textarea disabled={isViewMode} name="pulmonary_auscultation" value={formData.pulmonary_auscultation} onChange={handleInputChange} className={`${getInputClasses('pulmonary_auscultation')} h-24 resize-none`} placeholder="Murmúrio vesicular, ruídos adventícios..."></textarea>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div className="space-y-4">
                    <label className={labelClasses}>Alterações Auditivas</label>
                    <div className="flex gap-4">
                      {['Não', 'Sim'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => setFormData(prev => ({ ...prev, auditory_alteration: option }))}
                          className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                            formData.auditory_alteration === option 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          } disabled:opacity-50`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {formData.auditory_alteration === 'Sim' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={labelClasses}>Descreva as alterações <span className="text-red-500">*</span></label>
                        <input 
                          disabled={isViewMode}
                          name="auditory_alteration_details" 
                          value={formData.auditory_alteration_details} 
                          onChange={handleInputChange} 
                          type="text" 
                          className={getInputClasses('auditory_alteration_details')} 
                          placeholder="Descreva as alterações auditivas..." 
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className={labelClasses}>Alterações Visuais</label>
                    <div className="flex gap-4">
                      {['Não', 'Sim'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => setFormData(prev => ({ ...prev, visual_alteration: option }))}
                          className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                            formData.visual_alteration === option 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          } disabled:opacity-50`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {formData.visual_alteration === 'Sim' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={labelClasses}>Descreva as alterações <span className="text-red-500">*</span></label>
                        <input 
                          disabled={isViewMode}
                          name="visual_alteration_details" 
                          value={formData.visual_alteration_details} 
                          onChange={handleInputChange} 
                          type="text" 
                          className={getInputClasses('visual_alteration_details')} 
                          placeholder="Descreva as alterações visuais..." 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div className="space-y-4">
                    <label className={labelClasses}>Dispositivo para Auxílio de Marcha</label>
                    <div className="flex gap-4">
                      {['Não', 'Sim'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => setFormData(prev => ({ ...prev, gait_aid: option }))}
                          className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                            formData.gait_aid === option 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          } disabled:opacity-50`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {formData.gait_aid === 'Sim' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={labelClasses}>Qual dispositivo? <span className="text-red-500">*</span></label>
                        <input 
                          disabled={isViewMode}
                          name="gait_aid_details" 
                          value={formData.gait_aid_details} 
                          onChange={handleInputChange} 
                          type="text" 
                          className={getInputClasses('gait_aid_details')} 
                          placeholder="Ex: Bengala, andador, muletas..." 
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className={labelClasses}>Exames Complementares?</label>
                    <div className="flex gap-4">
                      {['Não', 'Sim'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => setFormData(prev => ({ ...prev, has_complementary_exams: option }))}
                          className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                            formData.has_complementary_exams === option 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          } disabled:opacity-50`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {formData.has_complementary_exams === 'Sim' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className={labelClasses}>Descrição dos Exames <span className="text-red-500">*</span></label>
                          <textarea 
                            disabled={isViewMode}
                            name="complementary_exams_details" 
                            value={formData.complementary_exams_details} 
                            onChange={handleInputChange} 
                            className={`${getInputClasses('complementary_exams_details')} h-24 resize-none`} 
                            placeholder="Descreva os resultados dos exames..."
                          ></textarea>
                        </div>
                        
                        <div>
                          <label className={labelClasses}>Arquivos dos Exames (Imagens ou PDF - Máx. 10)</label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                            {examFiles.map((file, index) => (
                              <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                {file.startsWith('data:application/pdf') ? (
                                  <div className="flex flex-col items-center gap-1 text-slate-400">
                                    <FileText size={32} />
                                    <span className="text-[10px] font-bold uppercase">PDF</span>
                                  </div>
                                ) : (
                                  <img src={file} alt={`Exame ${index + 1}`} className="w-full h-full object-cover" />
                                )}
                                {!isViewMode && (
                                  <button 
                                    onClick={() => removeFile(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {examFiles.length < 10 && !isViewMode && (
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all overflow-hidden"
                              >
                                <Plus size={28} className="shrink-0" />
                              </button>
                            )}
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*,application/pdf" 
                            multiple 
                            className="hidden" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Inspeção e Palpação</label>
                  <textarea disabled={isViewMode} name="inspection_palpation" value={formData.inspection_palpation} onChange={handleInputChange} className={`${getInputClasses('inspection_palpation')} h-32 resize-none`} placeholder="Avaliação postural, presença de edema, cicatrizes, pontos gatilho..."></textarea>
                </div>
              </div>
            )}

            {activeTab === 'anamnese' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><ClipboardList size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Anamnese Completa</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelClasses}>Data da Avaliação</label>
                      <input disabled={isViewMode} name="evaluation_date" value={formData.evaluation_date} onChange={handleInputChange} type="text" className={getInputClasses('evaluation_date')} placeholder="DD/MM/AAAA" maxLength={10} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Queixa Principal</label>
                    <textarea disabled={isViewMode} name="chief_complaint" value={formData.chief_complaint} onChange={handleInputChange} className={`${getInputClasses('chief_complaint')} h-32 resize-none`} placeholder="Descreva detalhadamente o motivo da consulta..."></textarea>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <label className="text-sm font-bold text-slate-700 mb-4 block ml-1">Escala Visual Analógica de Dor (EVA)</label>
                    <div className="flex flex-wrap gap-2 justify-between">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={isViewMode}
                          onClick={() => setFormData(prev => ({ ...prev, pain_scale: num.toString() }))}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                            formData.pain_scale === num.toString()
                            ? `${getPainColor(num)} text-white scale-110 shadow-lg ring-4 ring-white`
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-400'
                          } disabled:opacity-50`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Sem Dor</span>
                      <span>Dor Moderada</span>
                      <span>Dor Máxima</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelClasses}>O que piora a dor?</label>
                      <textarea disabled={isViewMode} name="pain_worsening_factors" value={formData.pain_worsening_factors} onChange={handleInputChange} className={`${getInputClasses('pain_worsening_factors')} h-24 resize-none`} placeholder="Ex: Movimentos bruscos, frio, ficar em pé..."></textarea>
                    </div>
                    <div>
                      <label className={labelClasses}>O que melhora a dor?</label>
                      <textarea disabled={isViewMode} name="pain_improvement_factors" value={formData.pain_improvement_factors} onChange={handleInputChange} className={`${getInputClasses('pain_improvement_factors')} h-24 resize-none`} placeholder="Ex: Repouso, calor local, medicação..."></textarea>
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>História da Doença Atual (HDA)</label>
                    <textarea disabled={isViewMode} name="history_present_illness" value={formData.history_present_illness} onChange={handleInputChange} className={`${getInputClasses('history_present_illness')} h-32 resize-none`} placeholder="Início dos sintomas, evolução, fatores de melhora/piora..."></textarea>
                  </div>

                  <div>
                    <label className={labelClasses}>História da Doença Pregressa (HDP)</label>
                    <textarea disabled={isViewMode} name="previous_illness_history" value={formData.previous_illness_history} onChange={handleInputChange} className={`${getInputClasses('previous_illness_history')} h-32 resize-none`} placeholder="Doenças anteriores, traumas, internações..."></textarea>
                  </div>

                  <div>
                    <label className={labelClasses}>Histórico Familiar</label>
                    <textarea disabled={isViewMode} name="family_history" value={formData.family_history} onChange={handleInputChange} className={`${getInputClasses('family_history')} h-32 resize-none`} placeholder="Doenças hereditárias, histórico de saúde da família..."></textarea>
                  </div>

                  <div className="border-t border-slate-100 pt-8 space-y-8">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Histórico Social</h4>
                    
                    <div className="space-y-4">
                      <label className={labelClasses}>Consome bebida alcoólica?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, drinks: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.drinks === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {formData.drinks === 'Sim' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className={labelClasses}>Frequência e tipo <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="drinks_details" 
                            value={formData.drinks_details} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('drinks_details')} 
                            placeholder="Frequência e tipo de bebida..." 
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className={labelClasses}>É fumante ou ex-fumante?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, smokes: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.smokes === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {formData.smokes === 'Sim' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className={labelClasses}>Quantidade e tempo <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="smokes_details" 
                            value={formData.smokes_details} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('smokes_details')} 
                            placeholder="Quantidade de cigarros por dia/tempo..." 
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className={labelClasses}>Pratica atividade física?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, sedentary: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.sedentary === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {formData.sedentary === 'Sim' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className={labelClasses}>Quais atividades? <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="sedentary_details" 
                            value={formData.sedentary_details} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('sedentary_details')} 
                            placeholder="Ex: Caminhada 3x por semana, musculação..." 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                    <div className="space-y-4">
                      <label className={labelClasses}>Faz uso de medicamentos?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, has_medications: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.has_medications === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {formData.has_medications === 'Sim' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className={labelClasses}>Quais medicamentos? <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="medications" 
                            value={formData.medications} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('medications')} 
                            placeholder="Quais medicamentos?" 
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className={labelClasses}>Cirurgias Prévias?</label>
                      <div className="flex gap-4">
                        {['Não', 'Sim'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, has_surgeries: option }))}
                            className={`px-6 py-2 rounded-xl border transition-all font-medium ${
                              formData.has_surgeries === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {formData.has_surgeries === 'Sim' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className={labelClasses}>Quais cirurgias? <span className="text-red-500">*</span></label>
                          <input 
                            disabled={isViewMode}
                            name="previous_surgeries" 
                            value={formData.previous_surgeries} 
                            onChange={handleInputChange} 
                            type="text" 
                            className={getInputClasses('previous_surgeries')} 
                            placeholder="Quais cirurgias e quando?" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'funcional' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Dumbbell size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Avaliação Funcional e Diagnóstico</h3>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className={labelClasses}>Tônus Muscular MMSS</label>
                      <div className="flex flex-wrap gap-3">
                        {['Normal', 'Hipertônico', 'Hipotônico'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, muscle_tone_mmss: option }))}
                            className={`px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
                              formData.muscle_tone_mmss === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className={labelClasses}>Tônus Muscular MMII</label>
                      <div className="flex flex-wrap gap-3">
                        {['Normal', 'Hipertônico', 'Hipotônico'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={isViewMode}
                            onClick={() => setFormData(prev => ({ ...prev, muscle_tone_mmii: option }))}
                            className={`px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
                              formData.muscle_tone_mmii === option 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className={labelClasses}>Amplitude de Movimento (ADM)</label>
                    <div className="space-y-3">
                      {admRows.map((row, index) => (
                        <div key={index} className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-200">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Movimento</label>
                            <input 
                              disabled={isViewMode}
                              type="text" 
                              value={row.movement} 
                              onChange={(e) => handleAdmRowChange(index, 'movement', e.target.value)}
                              className={getInputClasses(`adm_mov_${index}`)}
                              placeholder="Ex: Flexão de Ombro"
                            />
                          </div>
                          <div className="w-32">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Grau</label>
                            <input 
                              disabled={isViewMode}
                              type="text" 
                              value={row.degree} 
                              onChange={(e) => handleAdmRowChange(index, 'degree', e.target.value)}
                              className={getInputClasses(`adm_deg_${index}`)}
                              placeholder="Ex: 90°"
                            />
                          </div>
                          {admRows.length > 1 && !isViewMode && (
                            <button 
                              onClick={() => removeAdmRow(index)}
                              className="p-3 text-slate-300 hover:text-red-500 transition-colors mb-0.5"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isViewMode && (
                      <button 
                        onClick={addAdmRow}
                        className="mt-2 flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                      >
                        <Plus size={18} /> Adicionar Movimento
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>Força Muscular (Grau 0-5)</label>
                    <textarea disabled={isViewMode} name="muscle_strength" value={formData.muscle_strength} onChange={handleInputChange} className={`${getInputClasses('muscle_strength')} h-28 resize-none`} placeholder="Teste de força manual por grupos musculares..."></textarea>
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <label className="text-sm font-bold text-blue-700 mb-2 block ml-1">Diagnóstico Fisioterapêutico Final</label>
                    <textarea disabled={isViewMode} name="physio_diagnosis" value={formData.physio_diagnosis} onChange={handleInputChange} className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-32 font-medium text-blue-900 placeholder:text-blue-300 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Conclusão clínica e objetivos do tratamento..."></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historico-evolucoes' && id && (
              <EvolutionHistoryTab evaluationId={id} isReadOnly={isViewMode} />
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              {!isViewMode ? (
                <button 
                  disabled={activeTab === 'identificacao'}
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 disabled:opacity-20 transition-all px-4 py-2 rounded-xl hover:bg-slate-50"
                >
                  <ChevronLeft size={20} /> Voltar
                </button>
              ) : (
                <div /> // Espaçador para manter o alinhamento
              )}
              
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <div key={tab.id} className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>

              {!(isViewMode && activeTab === 'historico-evolucoes') && (
                <button 
                  onClick={handleNext}
                  className="bg-slate-100 text-blue-600 font-black flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
                >
                  {activeTab === 'historico-evolucoes' || activeTab === 'funcional' ? (id ? 'Atualizar' : 'Finalizar') : 'Próximo'} 
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <NotificationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel={modalConfig.cancelLabel}
      />
    </div>
  );
};

export default Evaluation;