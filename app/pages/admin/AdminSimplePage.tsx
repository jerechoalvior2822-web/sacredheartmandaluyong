import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Plus } from 'lucide-react';

interface AdminSimplePageProps {
  title: string;
  description: string;
  module: string;
}

export function AdminSimplePage({ title, description, module }: AdminSimplePageProps) {
  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Add New
          </Button>
        </div>

        <Card>
          <CardBody className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {module} management interface - CRUD operations for {module.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              This page would contain full CRUD functionality similar to Services Management
            </p>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
