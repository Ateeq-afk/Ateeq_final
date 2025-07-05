import { useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import BranchStaffManagement from '@/components/branches/BranchStaffManagement'
import { useBranches } from '@/hooks/useBranches'
import { useAuth } from '@/contexts/AuthContext'
import { BranchSelectionProvider, useBranchSelection } from '@/contexts/BranchSelectionContext'

function BranchStaffWrapper({ branchId }: { branchId: string }) {
  const { setSelectedBranch } = useBranchSelection()
  useEffect(() => {
    setSelectedBranch(branchId)
  }, [branchId])
  return <BranchStaffManagement />
}

export default function SuperAdminBranchPage() {
  const { user } = useAuth()
  const { branches, loading } = useBranches()

  const isSuperAdmin = user?.user_metadata?.role === 'superadmin'
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">All Branch Staff</h1>
      </div>
      {loading ? (
        <p>Loading branches...</p>
      ) : (
        branches.map(branch => (
          <div key={branch.id} className="space-y-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {branch.name} - {branch.city}
            </h2>
            <BranchSelectionProvider>
              <BranchStaffWrapper branchId={branch.id} />
            </BranchSelectionProvider>
          </div>
        ))
      )}
    </div>
  )
}
