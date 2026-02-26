import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '../types';
import { supabase } from '../lib/supabase';

interface CompanyContextType {
    activeCompany: Company | null;
    companies: Company[];
    setActiveCompany: (company: Company) => void;
    isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Note: In a real production app, we would have a 'user_companies' join table.
                // For this implementation, we'll fetch from a 'companies' table.
                const { data, error } = await supabase
                    .from('companies')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    const companiesData: Company[] = data.map(c => ({
                        id: c.id,
                        name: c.name,
                        ein: c.ein,
                        logoUrl: c.logo_url,
                        address: c.address
                    }));
                    setCompanies(companiesData);

                    // Try to restore from localStorage or default to first
                    const savedId = localStorage.getItem('activeCompanyId');
                    const lastActive = companiesData.find(c => c.id === savedId) || companiesData[0];
                    setActiveCompany(lastActive);
                }
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleSetActiveCompany = (company: Company) => {
        setActiveCompany(company);
        localStorage.setItem('activeCompanyId', company.id);
    };

    return (
        <CompanyContext.Provider value={{
            activeCompany,
            companies,
            setActiveCompany: handleSetActiveCompany,
            isLoading
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
