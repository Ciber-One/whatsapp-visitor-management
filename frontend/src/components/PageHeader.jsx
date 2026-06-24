export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
    <div>
      <h1 className="text-[28px] lg:text-[32px] font-bold leading-tight tracking-tight text-[#111827]">
        {title}
      </h1>
      {subtitle && <p className="text-[15px] text-[#64748B] mt-1.5">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2.5">{children}</div>}
  </div>
);
