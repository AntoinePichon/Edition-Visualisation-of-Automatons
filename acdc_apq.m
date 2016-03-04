function [ A3] = acdc_apq(A,Q,q))

if(q<=50)
    alpha=50/q;
    
else
        alpha=(100-q)/50;
end
    A1=double(A)-128;
    A2=dct2(A1);
    A3=fix(A2./Q/alpha);
end

